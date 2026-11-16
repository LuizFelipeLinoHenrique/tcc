-- Exclusão lógica: retira o pedido da aplicação sem apagar o histórico financeiro.
-- Versão alinhada ao histórico do projeto Supabase conectado.
alter table public.pedidos add column deleted_at timestamptz;
alter table public.pedidos add constraint pedidos_deleted_only_cancelled
  check (deleted_at is null or status = 'C');
comment on column public.pedidos.deleted_at is 'Exclusão de pedido cancelado; mantém vínculo financeiro e chave idempotente.';

create function public.guard_cancelled_order_deletion() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.deleted_at is not null then raise exception 'Um pedido novo não pode iniciar excluído'; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if old.status is distinct from 'C' then raise exception 'Cancele o pedido antes de excluí-lo'; end if;
    return old;
  end if;
  if old.deleted_at is not null then raise exception 'Pedido excluído não pode ser alterado'; end if;
  if new.deleted_at is not null then
    if auth.uid() is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
    if old.status is distinct from 'C' or new.status is distinct from 'C' then
      raise exception 'Cancele o pedido antes de excluí-lo';
    end if;
    if (to_jsonb(new) - 'deleted_at') is distinct from (to_jsonb(old) - 'deleted_at') then
      raise exception 'A exclusão não pode alterar os dados do pedido';
    end if;
  end if;
  return new;
end;
$$;
create trigger a_guard_cancelled_order_deletion before insert or update or delete on public.pedidos
for each row execute function public.guard_cancelled_order_deletion();

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
  if tg_op = 'DELETE' then
    raise exception 'Use a exclusão de pedidos cancelados para preservar o histórico financeiro';
  end if;
  if (to_jsonb(new) - 'status' - 'deleted_at') is distinct from (to_jsonb(old) - 'status' - 'deleted_at') then
    raise exception 'Cliente, itens, valores e vencimento ficam preservados após registrar o pedido';
  end if;
  if new.status is null or new.status not in ('P','E','C') or (old.status = 'C' and new.status <> 'C') then
    raise exception 'Status inválido ou pedido já cancelado';
  end if;
  return new;
end;
$$;

create function public.delete_cancelled_order(p_pedido bigint) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos;
begin
  if auth.uid() is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  select * into p from public.pedidos where id = p_pedido for update;
  if not found then raise exception 'Pedido não encontrado ou sem permissão' using errcode = '42501'; end if;
  if p.financial_user_id is not null and p.financial_user_id is distinct from auth.uid() then
    raise exception 'Somente o criador pode excluir um pedido com vínculo financeiro' using errcode = '42501';
  end if;
  if p.status is distinct from 'C' then raise exception 'Cancele o pedido antes de excluí-lo'; end if;
  -- Repetir após uma resposta incerta não produz erro nem altera o histórico.
  if p.deleted_at is not null then return p.id; end if;
  update public.pedidos set deleted_at = statement_timestamp() where id = p.id;
  return p.id;
end;
$$;
revoke all on function public.guard_cancelled_order_deletion() from public, anon, authenticated;
revoke all on function public.delete_cancelled_order(bigint) from public, anon;
grant execute on function public.delete_cancelled_order(bigint) to authenticated;
