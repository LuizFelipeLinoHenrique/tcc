-- Remoção de itens apenas antes do recebimento, com totais sincronizados e preços preservados.
-- Timestamp alinhado à migration aplicada no projeto conectado.
create or replace function public.guard_order_finance() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or new.financial_user_id is distinct from auth.uid() then
      raise exception 'Sessão necessária para registrar pedido' using errcode = '42501';
    end if;
    if new.due_date is null or new.total_cents is null or new.request_id is null or new.status is distinct from 'P' then
      raise exception 'Informe vencimento, valor e chave da requisição; pedidos novos iniciam pendentes';
    end if;
    new.financial_created_xid := pg_current_xact_id();
    return new;
  end if;
  if old.financial_user_id is null then
    if tg_op = 'UPDATE' and (new.financial_user_id is not null or new.due_date is not null
      or new.total_cents is not null or new.request_id is not null or new.financial_created_xid is not null) then
      raise exception 'Pedidos anteriores não podem receber vínculo financeiro retroativo por edição';
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if old.financial_user_id is distinct from auth.uid() then
    raise exception 'Somente o criador pode alterar um pedido com vínculo financeiro' using errcode = '42501';
  end if;
  -- O trigger a_guard_cancelled_order_deletion já validou status e recebimento.
  if tg_op = 'DELETE' then return old; end if;
  if (to_jsonb(new) - 'status' - 'total_cents' - 'id_produto' - 'qtde') is distinct from (to_jsonb(old) - 'status' - 'total_cents' - 'id_produto' - 'qtde') then
    raise exception 'Cliente, itens, valores e vencimento ficam preservados após registrar o pedido';
  end if;
  if row(new.total_cents,new.id_produto,new.qtde) is distinct from row(old.total_cents,old.id_produto,old.qtde) then
    perform 1 from public.cash_flow_entries where order_id = old.id and status = 'pending' for update;
    if not found or old.status = 'C' or new.status = 'C' then
      raise exception 'Produtos só podem ser adicionados antes do recebimento e do cancelamento';
    end if;
    if not exists (select 1 from public.pedido_itens where id_pedido = old.id and id_produto = new.id_produto and qtde = new.qtde) or new.total_cents::numeric is distinct from (
      select sum(qtde::numeric * unit_price_cents) from public.pedido_itens where id_pedido = old.id
    ) then raise exception 'Total financeiro não corresponde aos itens do pedido'; end if;
  end if;
  if new.status is null or new.status not in ('P','E','C') or (old.status = 'C' and new.status <> 'C') then
    raise exception 'Status inválido ou pedido já cancelado';
  end if;
  return new;
end;
$$;

create or replace function public.guard_order_item_finance() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos; price numeric;
begin
  if tg_op <> 'INSERT' then
    select * into p from public.pedidos where id = old.id_pedido for update;
    if p.financial_user_id is not null then
      if tg_op = 'UPDATE' then raise exception 'Preços e quantidades dos itens registrados ficam preservados'; end if;
      if p.financial_user_id is distinct from auth.uid() then raise exception 'Pedido indisponível para edição' using errcode = '42501'; end if;
      perform 1 from public.cash_flow_entries where order_id = p.id and status = 'pending' for update;
      if not found or p.status = 'C' then raise exception 'Produtos só podem ser removidos antes do recebimento e do cancelamento'; end if;
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
    if price is null or price < 0 or price > 999999999999 then
      raise exception 'Produto sem preço válido para venda';
    end if;
    new.unit_price_cents := price::bigint;
  end if;
  return new;
end;
$$;

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
        if exists (
          select 1 from public.pedido_itens i join jsonb_array_elements(normalized) entry
          on (entry->>'id_produto')::bigint = i.id_produto
          where i.id_pedido = p.id and (entry->>'qtde')::bigint <> i.qtde
        ) then raise exception 'Preserve as quantidades dos produtos que permanecerem no pedido'; end if;
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

create or replace function public.check_order_financial_total() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos; order_key bigint; total numeric;
begin
  if tg_table_name = 'pedido_itens' then
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
drop trigger check_order_item_financial_total on public.pedido_itens;
create constraint trigger check_order_item_financial_total after insert or delete on public.pedido_itens
deferrable initially deferred for each row execute function public.check_order_financial_total();
