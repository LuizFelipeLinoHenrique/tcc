-- Sem backfill financeiro: os registros anteriores continuam independentes.
-- Versão alinhada à migration aplicada no projeto Supabase conectado.
alter table public.pedido_itens add column unit_price_cents bigint
  check (unit_price_cents between 0 and 999999999999);
alter table public.pedidos
  add column financial_user_id uuid references auth.users(id) on delete restrict,
  add column due_date date,
  add column total_cents bigint,
  add column request_id uuid,
  add column financial_created_xid xid8,
  add constraint pedidos_financial_data check (
    (financial_user_id is null and due_date is null and total_cents is null and request_id is null and financial_created_xid is null)
    or (financial_user_id is not null and due_date is not null and total_cents is not null
      and request_id is not null and financial_created_xid is not null
      and due_date between date '1900-01-01' and date '9999-12-31'
      and total_cents between 1 and 999999999999)
  ),
  add constraint pedidos_financial_request unique(financial_user_id, request_id);
alter table public.cash_flow_entries add column order_id bigint
  references public.pedidos(id) on delete restrict unique;
comment on column public.pedido_itens.unit_price_cents is 'Preço efetivo em centavos. NULL identifica item legado sem histórico recuperável.';
comment on table public.cash_flow_entries is 'Lançamentos por usuário. Pedidos novos geram entrada pendente; recebimento sempre explícito.';

create function public.guard_order_finance() returns trigger
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
  if tg_op = 'DELETE' then
    raise exception 'Pedido com histórico financeiro não pode ser excluído. Use o status Cancelado';
  end if;
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Cliente, itens, valores e vencimento ficam preservados após registrar o pedido';
  end if;
  if new.status is null or new.status not in ('P','E','C') or (old.status = 'C' and new.status <> 'C') then
    raise exception 'Status inválido ou pedido já cancelado';
  end if;
  return new;
end;
$$;
create trigger guard_order_finance before insert or update or delete on public.pedidos
for each row execute function public.guard_order_finance();

create function public.sync_order_finance() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.financial_user_id is null then return new; end if;
  if tg_op = 'INSERT' then
    insert into public.cash_flow_entries(user_id, order_id, description, type, amount_cents, category, account, due_date, status)
    values(new.financial_user_id, new.id, 'Venda - Pedido #' || new.id, 'income', new.total_cents, 'Vendas', 'Caixa principal', new.due_date, 'pending');
  elsif new.status = 'C' and old.status is distinct from 'C' then
    -- Somente pendências: recebimentos realizados permanecem no histórico.
    update public.cash_flow_entries set status = 'cancelled'
    where order_id = new.id and status = 'pending';
  end if;
  if not exists (select 1 from public.cash_flow_entries where order_id = new.id) then
    raise exception 'Movimentação vinculada indisponível';
  end if;
  return new;
end;
$$;
create trigger sync_order_finance after insert or update on public.pedidos
for each row execute function public.sync_order_finance();

create function public.guard_order_item_finance() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos; price numeric;
begin
  if tg_op <> 'INSERT' then
    select * into p from public.pedidos where id = old.id_pedido for share;
    if p.financial_user_id is not null then
      raise exception 'Itens e preços da venda ficam preservados após registrar o pedido';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  select * into p from public.pedidos where id = new.id_pedido for share;
  if p.financial_user_id is not null then
    if tg_op <> 'INSERT' or p.financial_user_id is distinct from auth.uid()
      or p.financial_created_xid is distinct from pg_current_xact_id() then
      raise exception 'Itens e preços da venda ficam preservados após registrar o pedido';
    end if;
    select round(preco::numeric * 100) into price from public.produtos where id = new.id_produto for share;
    if price is null or price < 0 or price > 999999999999 then
      raise exception 'Produto sem preço válido para venda';
    end if;
    new.unit_price_cents := price::bigint;
  end if;
  return new;
end;
$$;
create trigger guard_order_item_finance before insert or update or delete on public.pedido_itens
for each row execute function public.guard_order_item_finance();

-- Impede até INSERT direto de cabeçalho sem itens: tudo é validado no COMMIT da RPC.
create function public.check_order_financial_total() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare total numeric;
begin
  select sum(qtde::numeric * unit_price_cents) into total
  from public.pedido_itens where id_pedido = new.id;
  if total is distinct from new.total_cents::numeric or not exists (
    select 1 from public.pedido_itens where id_pedido = new.id and id_produto = new.id_produto and qtde = new.qtde
  ) then
    raise exception 'Total financeiro não corresponde aos itens do pedido';
  end if;
  return null;
end;
$$;
create constraint trigger check_order_financial_total after insert on public.pedidos
deferrable initially deferred for each row execute function public.check_order_financial_total();

create function public.guard_linked_cash_entry() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos;
begin
  if tg_op <> 'INSERT' and old.order_id is not null then
    if tg_op = 'DELETE' then raise exception 'Recebimento de pedido não pode ser excluído. Cancele o pedido pendente'; end if;
    if row(new.order_id,new.user_id,new.type,new.amount_cents,new.due_date)
      is distinct from row(old.order_id,old.user_id,old.type,old.amount_cents,old.due_date) then
      raise exception 'Vínculo, valor, tipo e vencimento do pedido não podem ser alterados no caixa';
    end if;
    if old.status in ('paid','cancelled') and row(new.status,new.paid_date) is distinct from row(old.status,old.paid_date) then
      raise exception 'Recebimento realizado ou cancelado não pode ser reaberto ou estornado automaticamente';
    end if;
  elsif tg_op = 'UPDATE' and new.order_id is not null then
    raise exception 'Não é permitido vincular um lançamento manual a um pedido';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.order_id is not null then
    -- Serializa com cancelamento do pedido. Em disputa, o PostgreSQL aborta uma operação.
    select * into p from public.pedidos where id = new.order_id for share;
    if p.id is null or p.financial_user_id is distinct from auth.uid()
      or new.user_id is distinct from p.financial_user_id or new.type <> 'income'
      or new.amount_cents is distinct from p.total_cents or new.due_date is distinct from p.due_date then
      raise exception 'Recebimento incompatível com o pedido de origem';
    end if;
    if tg_op = 'INSERT' and (new.status <> 'pending' or p.financial_created_xid is distinct from pg_current_xact_id()) then
      raise exception 'O recebimento é criado apenas junto ao pedido, inicialmente pendente';
    end if;
    if tg_op = 'UPDATE' and old.status = 'pending' then
      if (new.status = 'cancelled' and p.status <> 'C') or (new.status = 'paid' and p.status = 'C') then
        raise exception 'Cancele o pedido para cancelar a pendência; pedido cancelado não pode ser recebido';
      end if;
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_linked_cash_entry before insert or update or delete on public.cash_flow_entries
for each row execute function public.guard_linked_cash_entry();

drop function public.save_order_items(bigint,jsonb,text,bigint);
create function public.save_order_items(
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
    if p.id_cliente is distinct from p_cliente or normalized is distinct from stored
      or (p_pedido is null and p.due_date is distinct from p_due_date) then
      raise exception 'Pedido já registrado: cliente, itens e vencimento preservados. Consulte a lista antes de registrar outra venda';
    end if;
    if p_pedido is not null then update public.pedidos set status = p_status where id = p.id; end if;
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
revoke all on function public.save_order_items(bigint,jsonb,text,bigint,date,uuid) from public, anon;
grant execute on function public.save_order_items(bigint,jsonb,text,bigint,date,uuid) to authenticated;
revoke all on function public.guard_order_finance(), public.sync_order_finance(), public.guard_order_item_finance(),
  public.check_order_financial_total(), public.guard_linked_cash_entry() from public, anon, authenticated;
