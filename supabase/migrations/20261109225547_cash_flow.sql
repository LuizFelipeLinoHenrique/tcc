create table public.cash_flow_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  description text not null check (char_length(btrim(description)) between 1 and 160),
  type text not null check (type in ('income', 'expense')),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 999999999999),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  account text not null check (char_length(btrim(account)) between 1 and 80),
  due_date date not null check (due_date between date '1900-01-01' and date '9999-12-31'),
  paid_date date,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  constraint cash_flow_payment_status check (
    (status = 'paid' and paid_date is not null and paid_date between date '1900-01-01' and (now() at time zone 'America/Sao_Paulo')::date)
    or (status <> 'paid' and paid_date is null)
  )
);
comment on table public.cash_flow_entries is 'Lançamentos financeiros por usuário; valores positivos em centavos. Recebimentos são registrados explicitamente, sem inferência a partir de pedidos.';
create index cash_flow_owner_id_idx on public.cash_flow_entries (user_id, id);
create index cash_flow_due_idx on public.cash_flow_entries (user_id, due_date);
alter table public.cash_flow_entries enable row level security;
create policy cash_flow_select on public.cash_flow_entries for select to authenticated
  using ((select auth.uid()) = user_id);
create policy cash_flow_insert on public.cash_flow_entries for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy cash_flow_update on public.cash_flow_entries for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy cash_flow_delete on public.cash_flow_entries for delete to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.cash_flow_entries from anon;
grant select, insert, update, delete on public.cash_flow_entries to authenticated;

