-- Executar na mesma transação que:
-- select set_config('app.cash_test_user_id', 'UUID_DO_USUARIO', true);
-- Datas relativas ao dia da carga. Reexecuções preservam registros editados.
do $seed$
declare
  owner_id uuid := coalesce(nullif(current_setting('app.cash_test_user_id', true), '')::uuid, auth.uid());
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  month_start date := date_trunc('month', today)::date;
begin
  if owner_id is null or not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Defina app.cash_test_user_id com o UUID de um usuário existente.';
  end if;

  with scenarios(key, description, type, amount_cents, category, due_date, paid_date, status) as (
    values
      ('opening', 'Saldo inicial', 'income', 1000000, 'Saldo inicial', month_start - 1, month_start - 1, 'paid'),
      ('sale', 'Venda de pallets recebida', 'income', 325050, 'Vendas', today - 2, today - 1, 'paid'),
      ('service', 'Serviço de manutenção recebido', 'income', 85075, 'Serviços', today, today, 'paid'),
      ('materials', 'Compra de madeira paga', 'expense', 135040, 'Materiais', today - 2, today - 1, 'paid'),
      ('rent', 'Aluguel do galpão pago', 'expense', 180000, 'Aluguel', month_start, month_start, 'paid'),
      ('late-income', 'Cliente com recebimento atrasado', 'income', 210000, 'Vendas', today - 5, null, 'pending'),
      ('late-expense', 'Fornecedor com pagamento atrasado', 'expense', 130000, 'Fornecedores', today - 3, null, 'pending'),
      ('today', 'Frete previsto para hoje', 'expense', 12500, 'Transporte', today, null, 'pending'),
      ('negative', 'Compra de máquina em 15 dias', 'expense', 2500000, 'Materiais', today + 15, null, 'pending'),
      ('recovery', 'Contrato a receber em 35 dias', 'income', 3200000, 'Vendas', today + 35, null, 'pending'),
      ('cancel-income', 'Venda cancelada', 'income', 9999999, 'Vendas', today, null, 'cancelled'),
      ('cancel-expense', 'Compra cancelada', 'expense', 8888888, 'Materiais', today, null, 'cancelled')
  ), pagination as (
    select 'page-' || n, 'Lote de pallets ' || lpad(n::text, 2, '0'),
      case when n % 2 = 0 then 'income' else 'expense' end,
      10000 + n * 137, case when n % 2 = 0 then 'Vendas' else 'Materiais' end,
      month_start + (n - 1), null::date, 'pending'
    from generate_series(1, 24) n
  ), monthly as (
    select 'month-' || m || '-' || kind,
      case when kind = 'income' then 'Venda mensal ' else 'Despesa mensal ' end ||
        to_char(month_start + make_interval(months => m), 'MM/YYYY'),
      kind, case when kind = 'income' then 180050 else 95025 end,
      case when kind = 'income' then 'Vendas' else 'Impostos' end,
      (month_start + make_interval(months => m) + interval '9 days')::date,
      case when m < 0 then (month_start + make_interval(months => m) + interval '10 days')::date else null::date end,
      case when m < 0 then 'paid' else 'pending' end
    from (values (-2), (-1), (1), (2), (3), (4)) months(m)
    cross join (values ('income'), ('expense')) types(kind)
  ), examples as (
    select * from scenarios union all select * from pagination union all select * from monthly
  )
  insert into public.cash_flow_entries
    (id, user_id, description, type, amount_cents, category, account, due_date, paid_date, status, notes)
  select md5('cash-flow-test-v2:' || owner_id::text || ':' || key)::uuid,
    owner_id, '[TESTE] ' || description, type, amount_cents, category, 'Caixa principal',
    due_date, paid_date, status, '[cash-flow-test-v2:' || key || '] Dados fictícios para testar o fluxo de caixa.'
  from examples
  on conflict (id) do nothing;
end;
$seed$;

