-- Pedidos anteriores à migração não tiveram baixa de estoque.
alter table public.pedidos
  add column controla_estoque boolean not null default false;

alter table public.pedidos alter column controla_estoque set default true;

create function public.sync_order_item_stock() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  order_id bigint;
  product_id bigint;
  quantity_delta bigint;
  product_name text;
begin
  if tg_op = 'DELETE' then
    order_id := old.id_pedido;
    product_id := old.id_produto;
    quantity_delta := -old.qtde;
  else
    order_id := new.id_pedido;
    product_id := new.id_produto;
    quantity_delta := new.qtde;
    if tg_op = 'UPDATE' then quantity_delta := new.qtde - old.qtde; end if;
  end if;

  if quantity_delta = 0 or not exists (
    select 1 from public.pedidos
    where id = order_id and controla_estoque and status <> 'C'
  ) then
    return null;
  end if;

  update public.produtos
  set quantidade_pronta_entrega = quantidade_pronta_entrega - quantity_delta
  where id = product_id and quantidade_pronta_entrega >= quantity_delta;
  if not found then
    select nome into product_name from public.produtos where id = product_id;
    raise exception 'Estoque insuficiente ou produto indisponível: %',
      coalesce(product_name, '#' || product_id::text);
  end if;
  return null;
end;
$$;

create trigger sync_order_item_stock
after insert or update of qtde or delete on public.pedido_itens
for each row execute function public.sync_order_item_stock();

create function public.restore_cancelled_order_stock() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare item record;
begin
  for item in
    select id_produto, qtde from public.pedido_itens
    where id_pedido = new.id order by id_produto
  loop
    update public.produtos
    set quantidade_pronta_entrega = quantidade_pronta_entrega + item.qtde
    where id = item.id_produto;
    if not found then
      raise exception 'Não foi possível devolver o produto #% ao estoque', item.id_produto;
    end if;
  end loop;
  return new;
end;
$$;

create trigger restore_cancelled_order_stock
after update of status on public.pedidos
for each row when (new.controla_estoque and new.status = 'C' and old.status is distinct from 'C')
execute function public.restore_cancelled_order_stock();

create or replace function public.save_order_items(
  p_cliente bigint, p_itens jsonb, p_status text default 'P', p_pedido bigint default null,
  p_due_date date default null, p_request_id uuid default null
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  pedido_id bigint; p public.pedidos; normalized jsonb; stored jsonb; total numeric;
begin
  if auth.uid() is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  if p_status is null or p_status not in ('P','E','C') or p_itens is null or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Itens ou status inválidos';
  end if;
  if jsonb_array_length(p_itens) = 0 or exists (
    select 1 from jsonb_array_elements(p_itens) item
    where jsonb_typeof(item) <> 'object' or coalesce(item->>'id_produto','') !~ '^[0-9]+$'
      or coalesce(item->>'qtde','') !~ '^[0-9]+$'
  ) then raise exception 'Adicione produtos e quantidades inteiras maiores que zero'; end if;
  if exists (select 1 from jsonb_array_elements(p_itens) item
    where (item->>'id_produto')::numeric not between 1 and 9007199254740991
      or (item->>'qtde')::numeric not between 1 and 9007199254740991)
    or (select count(distinct (item->>'id_produto')::bigint) from jsonb_array_elements(p_itens) item) <> jsonb_array_length(p_itens) then
    raise exception 'Produtos repetidos ou quantidades inválidas';
  end if;
  select jsonb_agg(jsonb_build_object('id_produto',(item->>'id_produto')::bigint,'qtde',(item->>'qtde')::bigint)
    order by (item->>'id_produto')::bigint) into normalized from jsonb_array_elements(p_itens) item;
  if p_pedido is null then
    if p_request_id is null or p_due_date is null or p_status <> 'P' then
      raise exception 'Informe vencimento e chave da requisição para o novo pedido';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || p_request_id::text, 0));
    select * into p from public.pedidos where financial_user_id = auth.uid() and request_id = p_request_id for update;
  else
    select * into p from public.pedidos where id = p_pedido for update;
    if not found then raise exception 'Pedido indisponível para edição' using errcode = '42501'; end if;
  end if;
  -- Bloqueia os produtos alterados em ordem antes de gravar os itens.
  if (p_pedido is null and p.id is null)
    or (p_pedido is not null and p.controla_estoque and p.status <> 'C' and p_status <> 'C'
      and p.financial_user_id = auth.uid()) then
    perform 1 from public.produtos product
    where product.id in (
      select coalesce(desired.id_produto, existing.id_produto)
      from jsonb_to_recordset(normalized) as desired(id_produto bigint, qtde bigint)
      full join (
        select id_produto, qtde from public.pedido_itens where id_pedido = p.id
      ) existing using (id_produto)
      where coalesce(desired.qtde, 0) <> coalesce(existing.qtde, 0)
    )
    order by product.id for no key update;
  end if;

  if p.id is not null and p.financial_user_id is not null then
    if p.financial_user_id is distinct from auth.uid() then raise exception 'Pedido indisponível para edição' using errcode = '42501'; end if;
    select jsonb_agg(jsonb_build_object('id_produto',id_produto,'qtde',qtde) order by id_produto) into stored
    from public.pedido_itens where id_pedido = p.id;
    if p.id_cliente is distinct from p_cliente or (p_pedido is null and normalized is distinct from stored)
      or (p_pedido is null and p.due_date is distinct from p_due_date) then
      raise exception 'Pedido já registrado: cliente, itens e vencimento preservados. Consulte a lista antes de registrar outra venda';
    end if;
    if p_pedido is not null then
      if normalized is distinct from stored then
        -- O payload completo permite repetir a mesma edição sem duplicar itens/receita.
        if p.status = 'C' or p_status = 'C' then raise exception 'Pedido cancelado não aceita novos produtos'; end if;
        perform 1 from public.cash_flow_entries where order_id = p.id and status = 'pending' for update;
        if not found then raise exception 'Produtos só podem ser adicionados antes do recebimento'; end if;
        update public.pedido_itens i set qtde = (entry->>'qtde')::bigint
        from jsonb_array_elements(normalized) entry
        where i.id_pedido = p.id and i.id_produto = (entry->>'id_produto')::bigint
          and i.qtde is distinct from (entry->>'qtde')::bigint;
        delete from public.pedido_itens i where i.id_pedido = p.id and not exists (
          select 1 from jsonb_array_elements(normalized) entry where (entry->>'id_produto')::bigint = i.id_produto
        );
        insert into public.pedido_itens(id_pedido,id_produto,qtde)
        select p.id,(entry->>'id_produto')::bigint,(entry->>'qtde')::bigint
        from jsonb_array_elements(normalized) entry
        where not exists (select 1 from public.pedido_itens i where i.id_pedido = p.id and i.id_produto = (entry->>'id_produto')::bigint);
        select sum(qtde::numeric * unit_price_cents) into total from public.pedido_itens where id_pedido = p.id;
        if total is null or total not between 1 and 999999999999 then raise exception 'Total do pedido fora do limite financeiro permitido'; end if;
        update public.pedidos set total_cents = total::bigint,
          id_produto = (normalized->0->>'id_produto')::bigint, qtde = (normalized->0->>'qtde')::bigint where id = p.id;
      end if;
      update public.pedidos set status = p_status where id = p.id;
    end if;
    return p.id;
  end if;
  if not exists (select 1 from public.clientes where id = p_cliente) then raise exception 'Cliente inválido' using errcode = '23503'; end if;
  if p_pedido is not null then
    -- Compatibilidade: pedidos legados continuam editáveis, sem gerar receita retroativa.
    update public.pedidos set id_cliente = p_cliente, id_produto = (p_itens->0->>'id_produto')::bigint,
      qtde = (p_itens->0->>'qtde')::bigint, status = p_status where id = p_pedido returning id into pedido_id;
    delete from public.pedido_itens where id_pedido = pedido_id;
  else
    perform 1 from public.produtos where id in (select (item->>'id_produto')::bigint from jsonb_array_elements(p_itens) item) for share;
    if (select count(*) from public.produtos where id in (select (item->>'id_produto')::bigint from jsonb_array_elements(p_itens) item)) <> jsonb_array_length(p_itens)
      or exists (select 1 from public.produtos where id in (select (item->>'id_produto')::bigint from jsonb_array_elements(p_itens) item) and (preco is null or preco < 0)) then
      raise exception 'Produto indisponível ou sem preço válido';
    end if;
    select sum(round(pr.preco::numeric * 100) * (item->>'qtde')::numeric) into total
    from jsonb_array_elements(p_itens) item join public.produtos pr on pr.id = (item->>'id_produto')::bigint;
    if total is null or total not between 1 and 999999999999 then raise exception 'Total do pedido fora do limite financeiro permitido'; end if;
    insert into public.pedidos(id_cliente,id_produto,qtde,status,financial_user_id,due_date,total_cents,request_id)
    values(p_cliente,(p_itens->0->>'id_produto')::bigint,(p_itens->0->>'qtde')::bigint,'P',auth.uid(),p_due_date,total::bigint,p_request_id)
    returning id into pedido_id;
  end if;
  insert into public.pedido_itens(id_pedido,id_produto,qtde)
  select pedido_id,(item->>'id_produto')::bigint,(item->>'qtde')::bigint from jsonb_array_elements(p_itens) item;
  return pedido_id;
end;
$$;
