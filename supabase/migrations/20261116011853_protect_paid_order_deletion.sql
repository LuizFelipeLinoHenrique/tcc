-- Recupera apenas a visibilidade de pedidos pagos ocultados pela regra anterior.
-- Versão alinhada à migration aplicada ao projeto conectado.
-- ALTER TABLE mantém o bloqueio de escrita até o commit da migration; os triggers
-- são reativados na mesma transação. Nenhum status ou valor financeiro é alterado.
alter table public.pedidos disable trigger a_guard_cancelled_order_deletion;
alter table public.pedidos disable trigger guard_order_finance;
update public.pedidos p set deleted_at = null
where p.deleted_at is not null and exists (
  select 1 from public.cash_flow_entries c where c.order_id = p.id and c.status = 'paid'
);
alter table public.pedidos enable trigger a_guard_cancelled_order_deletion;
alter table public.pedidos enable trigger guard_order_finance;

-- A cascata só é permitida depois de os guards do pedido validarem cancelamento,
-- propriedade e ausência de recebimentos. O guard do caixa ainda veta valores pagos.
alter table public.cash_flow_entries drop constraint cash_flow_entries_order_id_fkey;
alter table public.cash_flow_entries add constraint cash_flow_entries_order_id_fkey
  foreign key(order_id) references public.pedidos(id) on delete cascade;

create or replace function public.guard_cancelled_order_deletion() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.deleted_at is not null then raise exception 'Um pedido novo não pode iniciar excluído'; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if auth.uid() is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
    if old.financial_user_id is not null and old.financial_user_id is distinct from auth.uid() then
      raise exception 'Somente o criador pode excluir um pedido com vínculo financeiro' using errcode = '42501';
    end if;
    if old.status is distinct from 'C' then raise exception 'Cancele o pedido antes de excluí-lo'; end if;
    perform 1 from public.cash_flow_entries where order_id = old.id order by id for update;
    if exists(select 1 from public.cash_flow_entries where order_id = old.id and status = 'paid') then
      raise exception 'Pedido com recebimento realizado não pode ser excluído. O cancelamento preserva o histórico financeiro';
    end if;
    return old;
  end if;
  if new.deleted_at is distinct from old.deleted_at then
    raise exception 'Use a exclusão definitiva de pedidos cancelados sem recebimento. Pedidos pagos devem permanecer no histórico';
  end if;
  if old.deleted_at is not null then raise exception 'Pedido excluído não pode ser alterado'; end if;
  return new;
end;
$$;

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
  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Cliente, itens, valores e vencimento ficam preservados após registrar o pedido';
  end if;
  if new.status is null or new.status not in ('P','E','C') or (old.status = 'C' and new.status <> 'C') then
    raise exception 'Status inválido ou pedido já cancelado';
  end if;
  return new;
end;
$$;

create or replace function public.guard_linked_cash_entry() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos;
begin
  if tg_op <> 'INSERT' and old.order_id is not null then
    if tg_op = 'DELETE' then
      if old.status = 'paid' then raise exception 'Recebimento realizado de pedido não pode ser excluído'; end if;
      if old.user_id is distinct from auth.uid() then
        raise exception 'Sem permissão para excluir o vínculo financeiro' using errcode = '42501';
      end if;
      -- Apenas a cascata da FK: o cabeçalho já foi validado e removido.
      -- DELETE direto no caixa não pode retirar o vínculo para contornar a proteção.
      if pg_trigger_depth() < 2 or exists(select 1 from public.pedidos where id = old.order_id) then
        raise exception 'Exclua o pedido cancelado sem recebimento para remover seu vínculo financeiro';
      end if;
      return old;
    end if;
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

create or replace function public.delete_cancelled_order(p_pedido bigint) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare deleted_id bigint;
begin
  if auth.uid() is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  -- DELETE adquire o lock do cabeçalho; os triggers conferem os recebimentos
  -- sob lock e a cascata limpa caixa e itens na mesma transação.
  delete from public.pedidos where id = p_pedido returning id into deleted_id;
  if deleted_id is null then raise exception 'Pedido não encontrado ou já excluído' using errcode = 'P0001'; end if;
  return deleted_id;
end;
$$;
revoke all on function public.delete_cancelled_order(bigint) from public, anon;
grant execute on function public.delete_cancelled_order(bigint) to authenticated;

-- Se criação e exclusão ocorrerem na mesma transação, não há total a validar
-- para um cabeçalho já removido. Para pedidos existentes, a validação é mantida.
create or replace function public.check_order_financial_total() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare total numeric;
begin
  if not exists(select 1 from public.pedidos where id = new.id) then return null; end if;
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
