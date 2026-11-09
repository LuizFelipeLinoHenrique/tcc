-- Dados demonstrativos; executar com app.cash_demo_user_id definido na mesma transação.
-- O conjunto é identificado por notas [cash-flow-demo-v1:...] e IDs estáveis.
-- Reexecuções preservam os exemplos existentes, inclusive alterações feitas pela interface.
do $seed$
declare
  owner_id uuid := coalesce(nullif(current_setting('app.cash_demo_user_id', true), '')::uuid, auth.uid());
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  month_start date := date_trunc('month', today)::date;
begin
  if owner_id is null or not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Defina app.cash_demo_user_id com o UUID de um usuário existente.';
  end if;
  with scenarios(key, description, type, amount_cents, category, account, due_date, paid_date, status, notes) as (
    values
      ('opening-cash', 'Saldo inicial do caixa', 'income', 300000, 'Saldo inicial', 'Caixa principal', month_start - 1, month_start - 1, 'paid', 'Saldo anterior para conferir a abertura do período.'),
      ('opening-bank', 'Saldo inicial bancário', 'income', 700000, 'Saldo inicial', 'Banco operacional', month_start - 1, month_start - 1, 'paid', 'Saldo anterior da segunda conta.'),
      ('prior-sale', 'Venda no mês anterior', 'income', 150000, 'Vendas', 'Banco operacional', month_start - 8, month_start - 8, 'paid', 'Consulte o mês anterior e o saldo de abertura.'),
      ('prior-cost', 'Compra no mês anterior', 'expense', 50000, 'Materiais', 'Banco operacional', month_start - 5, month_start - 4, 'paid', 'Data de pagamento diferente do vencimento.'),
      ('sale-paid', 'Venda de pallets recebida', 'income', 325050, 'Vendas', 'Banco operacional', month_start, month_start, 'paid', 'Recebimento realizado com centavos.'),
      ('service-paid', 'Serviço de manutenção recebido', 'income', 85075, 'Serviços', 'Caixa principal', month_start, month_start, 'paid', 'Entrada realizada em outra categoria.'),
      ('capital-paid', 'Aporte dos sócios', 'income', 200000, 'Aportes', 'Banco operacional', today, today, 'paid', 'Entrada realizada hoje.'),
      ('materials-paid', 'Madeira e insumos pagos', 'expense', 135040, 'Materiais', 'Banco operacional', month_start, month_start, 'paid', 'Verifique o gráfico de saídas por categoria.'),
      ('supplier-paid', 'Pagamento a fornecedor', 'expense', 95000, 'Fornecedores', 'Banco operacional', today - 1, today, 'paid', 'Pagamento efetuado após o vencimento.'),
      ('salary-paid', 'Folha de pagamento', 'expense', 240000, 'Salários', 'Banco operacional', today, today, 'paid', 'Despesa realizada.'),
      ('rent-paid', 'Aluguel do galpão', 'expense', 180000, 'Aluguel', 'Banco operacional', month_start, month_start, 'paid', 'Despesa fixa já paga.'),
      ('tax-paid', 'Impostos recolhidos', 'expense', 42035, 'Impostos', 'Banco operacional', today, today, 'paid', 'Despesa com centavos.'),
      ('transport-paid', 'Frete pago em dinheiro', 'expense', 18750, 'Transporte', 'Caixa principal', today, today, 'paid', 'Saída realizada do caixa.'),
      ('custom-paid', 'Manutenção preventiva', 'expense', 23050, 'Manutenção de equipamentos', 'Caixa principal', today, today, 'paid', 'Categoria personalizada para busca e filtros.'),
      ('late-payment', 'Venda vencida no mês anterior e recebida hoje', 'income', 119990, 'Vendas', 'Banco operacional', month_start - 3, today, 'paid', 'Deve aparecer no período do recebimento, não no mês do vencimento.'),
      ('overdue-income', 'Cliente com recebimento atrasado', 'income', 210000, 'Vendas', 'Banco operacional', today - 5, null, 'pending', 'Teste o filtro Vencidos e a entrada da pendência no primeiro dia da projeção.'),
      ('overdue-expense', 'Fornecedor com pagamento atrasado', 'expense', 130000, 'Fornecedores', 'Banco operacional', today - 3, null, 'pending', 'Use Registrar pagamento para revisar valor e data.'),
      ('old-overdue', 'Imposto pendente do mês anterior', 'expense', 17500, 'Impostos', 'Banco operacional', month_start - 2, null, 'pending', 'Alerta considera todas as datas; consulte o mês anterior para listar.'),
      ('today-income', 'Recebimento previsto para hoje', 'income', 65000, 'Serviços', 'Caixa principal', today, null, 'pending', 'Vence hoje, portanto ainda não está vencido.'),
      ('today-expense', 'Frete previsto para hoje', 'expense', 12500, 'Transporte', 'Caixa principal', today, null, 'pending', 'Movimentação prevista no primeiro dia da projeção.'),
      ('cancelled-income', 'Venda cancelada', 'income', 9999999, 'Vendas', 'Banco operacional', today, null, 'cancelled', 'Valor propositalmente alto: não deve afetar saldos ou projeções.'),
      ('cancelled-expense', 'Compra cancelada', 'expense', 8888888, 'Materiais', 'Banco operacional', today, null, 'cancelled', 'Não deve aparecer no gráfico de pagamentos realizados.'),
      ('edit', 'Exemplo para editar descrição e categoria', 'expense', 3555, 'Outros', 'Caixa principal', today + 2, null, 'pending', 'Pode ser editado sem alterar os demais exemplos.'),
      ('delete', 'Exemplo para testar exclusão', 'income', 100, 'Outros', 'Caixa principal', today + 3, null, 'pending', 'Registro descartável para confirmar ou cancelar a exclusão.'),
      ('csv', 'Exportação CSV: aspas e separadores', 'expense', 12345, 'Outros', 'Caixa principal', today + 1, null, 'pending', 'Conferir "aspas"; ponto e vírgula e acentuação: ação, manutenção.'),
      ('csv-formula', 'Exportação CSV: proteção de fórmula', 'income', 10, 'Outros', 'Caixa principal', today + 1, null, 'pending', '=SUM(1;2)'),
      ('negative', 'Compra de máquina — cenário de saldo negativo', 'expense', 2500000, 'Materiais', 'Banco operacional', today + 15, null, 'pending', 'Gera alerta de saldo negativo no horizonte de 30 dias.'),
      ('recover', 'Recebimento de contrato — recuperação do saldo', 'income', 3200000, 'Vendas', 'Banco operacional', today + 35, null, 'pending', 'Visível nos horizontes de 60 e 90 dias.'),
      ('day50', 'Tributos previstos em 50 dias', 'expense', 350000, 'Impostos', 'Banco operacional', today + 50, null, 'pending', 'Diferencia os horizontes de 30 e 60 dias.'),
      ('day75', 'Serviços previstos em 75 dias', 'income', 600000, 'Serviços', 'Banco operacional', today + 75, null, 'pending', 'Visível apenas no horizonte de 90 dias.'),
      ('day89', 'Manutenção prevista em 89 dias', 'expense', 150000, 'Manutenção de equipamentos', 'Banco operacional', today + 89, null, 'pending', 'Última saída relevante no horizonte de 90 dias.'),
      ('outside', 'Contrato além do horizonte de projeção', 'income', 5000000, 'Vendas', 'Banco operacional', today + 120, null, 'pending', 'Não deve afetar nenhuma das projeções disponíveis.')
  ), page_examples as (
    select 'page-' || n, 'Movimentação de paginação ' || lpad(n::text, 2, '0'),
      case when n % 2 = 0 then 'income' else 'expense' end,
      (1000 + n * 37)::bigint, case when n % 2 = 0 then 'Vendas' else 'Outros' end,
      'Caixa principal', month_start + ((n - 1) % 28), null::date, 'pending',
      'Exemplo para paginação, busca textual e exportação de mais de 25 resultados.'
    from generate_series(1, 32) n
  ), recurring as (
    select 'monthly-' || n, 'Aluguel recorrente — parcela ' || n || '/4',
      'expense', 180000::bigint, 'Aluguel', 'Banco operacional',
      ((month_start + interval '1 month - 1 day') + make_interval(months => n - 1))::date,
      null::date, 'pending',
      'Série mensal independente. O vencimento usa o último dia do mês de origem; meses mais curtos ajustam o dia.'
    from generate_series(1, 4) n
  ), all_examples as (
    select * from scenarios union all select * from page_examples union all select * from recurring
  )
  insert into public.cash_flow_entries (id, user_id, description, type, amount_cents, category, account, due_date, paid_date, status, notes)
  select md5('cash-flow-demo-v1:' || owner_id::text || ':' || key)::uuid, owner_id,
    '[TESTE] ' || description, type, amount_cents, category, account, due_date, paid_date, status,
    '[cash-flow-demo-v1:' || key || '] ' || notes
  from all_examples
  on conflict (id) do nothing;
end;
$seed$;
