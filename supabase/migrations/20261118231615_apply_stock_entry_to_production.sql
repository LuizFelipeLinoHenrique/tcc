alter table stock_adjustments.requests
  add column production_credit bigint not null default 0
  check (production_credit between 0 and greatest(delta, 0));

create function stock_adjustments.apply_production_credit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  item record;
  remaining bigint := new.production_credit;
  fulfilled bigint;
  pending_production bigint;
begin
  if new.user_id is distinct from auth.uid() then
    raise exception 'Lançamento indisponível' using errcode = '42501';
  end if;

  select quantidade_a_produzir into strict pending_production
  from public.produtos where id = new.product_id for no key update;

  for item in
    select i.id_pedido, i.qtde_a_produzir
    from public.pedido_itens i
    join public.pedidos p on p.id = i.id_pedido
    where i.id_produto = new.product_id and i.qtde_a_produzir > 0
      and p.controla_estoque and p.status <> 'C'
    order by i.id_pedido
  loop
    fulfilled := least(remaining, item.qtde_a_produzir);
    update public.pedido_itens
    set qtde_a_produzir = qtde_a_produzir - fulfilled
    where id_pedido = item.id_pedido and id_produto = new.product_id;
    remaining := remaining - fulfilled;
    exit when remaining = 0;
  end loop;

  if remaining <> 0 or pending_production is distinct from (
    select coalesce(sum(i.qtde_a_produzir), 0)
    from public.pedido_itens i
    join public.pedidos p on p.id = i.id_pedido
    where i.id_produto = new.product_id and i.qtde_a_produzir > 0
      and p.controla_estoque and p.status <> 'C'
  ) then
    raise exception 'A quantidade a produzir diverge dos itens dos pedidos';
  end if;
  return new;
end;
$$;

revoke all on function stock_adjustments.apply_production_credit() from public, anon, authenticated;

create trigger apply_production_credit
after insert on stock_adjustments.requests
for each row when (new.production_credit > 0)
execute function stock_adjustments.apply_production_credit();

create or replace function public.guard_order_item_finance() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos; price numeric;
begin
  -- O lançamento interno só pode reduzir a parcela a produzir do item.
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1
    and new.qtde_a_produzir < old.qtde_a_produzir
    and (to_jsonb(new) - 'qtde_a_produzir') = (to_jsonb(old) - 'qtde_a_produzir') then
    return new;
  end if;

  if tg_op <> 'INSERT' then
    select * into p from public.pedidos where id = old.id_pedido for update;
    if p.financial_user_id is not null then
      if p.financial_user_id is distinct from auth.uid() then
        raise exception 'Pedido indisponível para edição' using errcode = '42501';
      end if;
      perform 1 from public.cash_flow_entries where order_id = p.id and status = 'pending' for update;
      if not found or p.status = 'C' then raise exception 'Itens só podem ser alterados antes do recebimento e do cancelamento'; end if;
      if tg_op = 'UPDATE' then
        if (to_jsonb(new) - 'qtde') is distinct from (to_jsonb(old) - 'qtde') then
          raise exception 'Somente a quantidade pode ser alterada nos itens registrados';
        end if;
        return new;
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  select * into p from public.pedidos where id = new.id_pedido for update;
  if p.financial_user_id is not null then
    if tg_op <> 'INSERT' or p.financial_user_id is distinct from auth.uid() or p.status = 'C' then
      raise exception 'Itens e preços da venda ficam preservados após registrar o pedido';
    end if;
    perform 1 from public.cash_flow_entries where order_id = p.id and status = 'pending' for update;
    if not found then raise exception 'Produtos só podem ser adicionados antes do recebimento'; end if;
    select round(preco::numeric * 100) into price from public.produtos where id = new.id_produto for share;
    if price is null or price < 0 or price > 999999999999 then raise exception 'Produto sem preço válido para venda'; end if;
    new.unit_price_cents := price::bigint;
  end if;
  return new;
end;
$$;

create or replace function public.sync_order_item_stock() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  order_id bigint;
  product_id bigint;
  quantity_delta bigint;
  previous_shortage bigint := 0;
  stock_delta bigint;
  shortage_delta bigint;
  available bigint;
begin
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1
    and new.qtde_a_produzir < old.qtde_a_produzir
    and (to_jsonb(new) - 'qtde_a_produzir') = (to_jsonb(old) - 'qtde_a_produzir') then
    return new;
  end if;

  if tg_op = 'DELETE' then
    order_id := old.id_pedido;
    product_id := old.id_produto;
    quantity_delta := -old.qtde;
  else
    order_id := new.id_pedido;
    product_id := new.id_produto;
    quantity_delta := new.qtde;
  end if;

  if tg_op <> 'INSERT' then previous_shortage := old.qtde_a_produzir; end if;
  if tg_op = 'UPDATE' then quantity_delta := new.qtde - old.qtde; end if;

  if quantity_delta <> 0 and exists (
    select 1 from public.pedidos
    where id = order_id and controla_estoque and status <> 'C'
  ) then
    if quantity_delta > 0 then
      select quantidade_pronta_entrega into available
      from public.produtos where id = product_id for no key update;
      if not found then raise exception 'Produto indisponível: #%', product_id; end if;
      stock_delta := least(quantity_delta, available);
      shortage_delta := quantity_delta - stock_delta;
    else
      -- Uma redução elimina primeiro a parte que ainda precisa ser produzida.
      shortage_delta := greatest(quantity_delta, -previous_shortage);
      stock_delta := quantity_delta - shortage_delta;
    end if;

    update public.produtos
    set quantidade_pronta_entrega = quantidade_pronta_entrega - stock_delta,
        quantidade_a_produzir = quantidade_a_produzir + shortage_delta
    where id = product_id;
    if not found then raise exception 'Não foi possível ajustar o produto #%', product_id; end if;
    previous_shortage := previous_shortage + shortage_delta;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  new.qtde_a_produzir := previous_shortage;
  return new;
end;
$$;

create or replace function public.check_order_financial_total() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos; order_key bigint; total numeric;
begin
  if tg_table_name = 'pedido_itens' then
    if tg_op = 'UPDATE' and (to_jsonb(new) - 'qtde_a_produzir') = (to_jsonb(old) - 'qtde_a_produzir') then
      return null;
    end if;
    if tg_op = 'DELETE' then order_key := old.id_pedido; else order_key := new.id_pedido; end if;
  else order_key := new.id; end if;
  select * into p from public.pedidos where id = order_key;
  if p.id is null or p.financial_user_id is null then return null; end if;
  select sum(qtde::numeric * unit_price_cents) into total from public.pedido_itens where id_pedido = p.id;
  if total is distinct from p.total_cents::numeric or not exists (
    select 1 from public.pedido_itens where id_pedido = p.id and id_produto = p.id_produto and qtde = p.qtde
  ) or not exists (
    select 1 from public.cash_flow_entries where order_id = p.id and amount_cents = p.total_cents
  ) then raise exception 'Total financeiro não corresponde aos itens do pedido'; end if;
  return null;
end;
$$;

create or replace function public.restore_cancelled_order_stock() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare item record;
begin
  -- A entrada pode abater pendências enquanto este cancelamento aguarda o produto.
  perform 1 from public.produtos pr
  where pr.id in (select id_produto from public.pedido_itens where id_pedido = new.id)
  order by pr.id for no key update;

  for item in
    select id_produto, qtde, qtde_a_produzir from public.pedido_itens
    where id_pedido = new.id order by id_produto
  loop
    update public.produtos
    set quantidade_pronta_entrega = quantidade_pronta_entrega + item.qtde - item.qtde_a_produzir,
        quantidade_a_produzir = quantidade_a_produzir - item.qtde_a_produzir
    where id = item.id_produto;
    if not found then
      raise exception 'Não foi possível devolver o produto #% ao estoque', item.id_produto;
    end if;
  end loop;
  return new;
end;
$$;

create or replace function public.adjust_product_ready_stock(
  p_product_id bigint, p_delta integer, p_request_key text
) returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  actor uuid := auth.uid();
  previous stock_adjustments.requests;
  current_stock bigint;
  pending_production bigint;
  production_credit bigint;
  stock_delta bigint;
  new_stock integer;
begin
  if actor is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  if p_product_id is null or p_product_id <= 0 or p_delta is null or p_delta = 0
    or p_request_key is null or length(p_request_key) not between 1 and 128 then
    raise exception 'Informe o produto e uma quantidade válida';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('stock:' || actor::text || ':' || p_request_key, 0));
  select * into previous from stock_adjustments.requests
  where user_id = actor and request_key = p_request_key;
  if found then
    if (previous.product_id, previous.delta) is distinct from (p_product_id, p_delta) then
      raise exception 'Este lançamento já foi registrado com outros dados';
    end if;
    return previous.result;
  end if;

  select quantidade_pronta_entrega, quantidade_a_produzir into current_stock, pending_production
  from public.produtos where id = p_product_id for no key update;
  if not found then raise exception 'Produto indisponível'; end if;
  production_credit := least(greatest(p_delta, 0), pending_production);
  stock_delta := p_delta - production_credit;
  if current_stock + stock_delta < 0 then
    raise exception 'Saldo insuficiente para a saída. Estoque atual: %', current_stock;
  end if;
  if current_stock + stock_delta > 2147483647 then
    raise exception 'O saldo ultrapassaria o limite de 2.147.483.647 unidades';
  end if;

  update public.produtos
  set quantidade_pronta_entrega = current_stock + stock_delta,
      quantidade_a_produzir = pending_production - production_credit
  where id = p_product_id returning quantidade_pronta_entrega into new_stock;
  if not found then raise exception 'Produto indisponível para ajuste'; end if;

  insert into stock_adjustments.requests(user_id, request_key, product_id, delta, result, production_credit)
  values (actor, p_request_key, p_product_id, p_delta, new_stock, production_credit);
  return new_stock;
end;
$$;
