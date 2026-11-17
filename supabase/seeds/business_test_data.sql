-- Execute como administrador do banco, em uma transação com:
-- select set_config('app.cash_test_user_id', 'UUID_DO_USUARIO_DE_TESTE', true);
do $seed$
declare
  owner_id uuid := coalesce(nullif(current_setting('app.cash_test_user_id', true), '')::uuid, auth.uid());
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  month_start date := date_trunc('month', today)::date;
  sale_day date;
  due_day date;
  settlement_day date;
  historical_order_cents bigint;
  client record;
  scenario record;
  seeded_order_id bigint;
  request_key uuid;
  standard_pallet bigint;
  reinforced_pallet bigint;
  custom_crate bigint;
begin
  if owner_id is null or not exists (select 1 from auth.users where id = owner_id) then
    raise exception 'Defina app.cash_test_user_id com o UUID de um usuário existente.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('business-test-v1', 0));
  perform set_config('request.jwt.claim.sub', owner_id::text, true);

  for client in select * from (values
    ('[TESTE] Logística Rota do Vale', 'rota-do-vale@example.com', 'Jundiaí, SP'),
    ('[TESTE] Alimentos Colheita Nova', 'colheita-nova@example.com', 'Campinas, SP'),
    ('[TESTE] Máquinas Horizonte', 'maquinas-horizonte@example.com', 'Sorocaba, SP'),
    ('[TESTE] Bebidas Serra Clara', 'bebidas-serra-clara@example.com', 'Atibaia, SP'),
    ('[TESTE] Cerâmica Vila Nova', 'ceramica-vila-nova@example.com', 'Santa Gertrudes, SP'),
    ('[TESTE] Autopeças Rota Oeste', 'autopecas-rota-oeste@example.com', 'Indaiatuba, SP'),
    ('[TESTE] Cooperativa Campo do Sol', 'cooperativa-campo-do-sol@example.com', 'Holambra, SP'),
    ('[TESTE] Distribuidora Porto das Flores', 'distribuidora-porto-das-flores@example.com', 'Santos, SP')
  ) as sample(name, email, address)
  loop
    insert into public.clientes (nome, email, endereco)
    select client.name, client.email, client.address
    where not exists (select from public.clientes c where c.email = client.email);
  end loop;

  insert into public.fornecedores (nome, email, endereco, contato)
  select sample.* from (values
    ('[TESTE] Madeireira Pinhal do Vale', 'pinhal-do-vale@example.com', 'Itapeva, SP', 'Marina Lopes'),
    ('[TESTE] Fixadores Alto Tietê', 'fixadores-alto-tiete@example.com', 'Mogi das Cruzes, SP', 'Rafael Lima'),
    ('[TESTE] Transportes Estrada Sul', 'estrada-sul@example.com', 'Jundiaí, SP', 'Camila Rocha'),
    ('[TESTE] Serraria Vale do Cedro', 'serraria-vale-do-cedro@example.com', 'Capão Bonito, SP', 'Bruno Freitas'),
    ('[TESTE] Compensados Nova Mata', 'compensados-nova-mata@example.com', 'Itapetininga, SP', 'Renata Campos'),
    ('[TESTE] Embalagens Cinta Forte', 'embalagens-cinta-forte@example.com', 'Louveira, SP', 'Leandro Moura'),
    ('[TESTE] Tratamento Térmico Serra Azul', 'tratamento-serra-azul@example.com', 'Mairinque, SP', 'Paula Nunes'),
    ('[TESTE] Ferramentas Oficina do Vale', 'ferramentas-oficina-do-vale@example.com', 'Salto, SP', 'Diego Matos')
  ) as sample(name, email, address, contact)
  where not exists (select from public.fornecedores f where f.email = sample.email);

  insert into public.produtos (nome, descricao, preco)
  select sample.* from (values
    ('[TESTE] Pallet de pinus 120 × 100 cm', 'Pallet de quatro entradas para movimentação em centros de distribuição.', 58),
    ('[TESTE] Pallet reforçado 120 × 100 cm', 'Pallet com travessas reforçadas para cargas industriais.', 92),
    ('[TESTE] Caixa de madeira 80 × 60 cm', 'Caixa fechada para proteger peças durante o transporte.', 145),
    ('[TESTE] Meio pallet 80 × 60 cm', 'Base compacta para exposição de caixas de bebidas no varejo.', 39),
    ('[TESTE] Pallet de eucalipto 120 × 100 cm', 'Base de madeira com deck fechado para empilhar caixas de cerâmica.', 84),
    ('[TESTE] Engradado de madeira 100 × 80 cm', 'Estrutura ventilada com travessas para transportar peças automotivas.', 112),
    ('[TESTE] Caixa ventilada 60 × 40 cm', 'Caixa ripada reutilizável para movimentação de hortaliças.', 48),
    ('[TESTE] Pallet de pinus tratado 120 × 80 cm', 'Base com tratamento térmico para movimentação de mercadorias destinadas à exportação.', 79)
  ) as sample(name, description, price)
  where not exists (select from public.produtos p where p.nome = sample.name);

  select id into strict standard_pallet from public.produtos where nome = '[TESTE] Pallet de pinus 120 × 100 cm';
  select id into strict reinforced_pallet from public.produtos where nome = '[TESTE] Pallet reforçado 120 × 100 cm';
  select id into strict custom_crate from public.produtos where nome = '[TESTE] Caixa de madeira 80 × 60 cm';

  for scenario in select * from (values
    ('stock', 'rota-do-vale@example.com', standard_pallet, 24, reinforced_pallet, 8, 10, 'P', 'pending'),
    ('dispatch', 'colheita-nova@example.com', standard_pallet, 18, null, null, -3, 'E', 'pending'),
    ('paid', 'maquinas-horizonte@example.com', reinforced_pallet, 12, custom_crate, 6, -6, 'E', 'paid'),
    ('cancelled', 'rota-do-vale@example.com', standard_pallet, 10, null, null, 7, 'C', 'cancelled')
  ) as sample(key, email, product_a, quantity_a, product_b, quantity_b, due_offset, order_status, cash_status)
  loop
    request_key := md5('business-test-v1:' || owner_id::text || ':' || scenario.key)::uuid;
    if exists (select from public.pedidos p where p.financial_user_id = owner_id and p.request_id = request_key) then
      continue;
    end if;

    select id into strict client from public.clientes where email = scenario.email;
    seeded_order_id := public.save_order_items(
      client.id,
      jsonb_build_array(jsonb_build_object('id_produto', scenario.product_a, 'qtde', scenario.quantity_a))
      || case when scenario.product_b is null then '[]'::jsonb else
        jsonb_build_array(jsonb_build_object('id_produto', scenario.product_b, 'qtde', scenario.quantity_b)) end,
      p_due_date := today + scenario.due_offset,
      p_request_id := request_key
    );

    update public.pedidos set status = scenario.order_status where id = seeded_order_id and scenario.order_status <> 'P';
    update public.cash_flow_entries as cash
    set notes = '[business-test-v1:' || scenario.key || '] Recebimento de pedido fictício.',
        status = scenario.cash_status,
        paid_date = case when scenario.cash_status = 'paid' then today - 5 end
    where cash.order_id = seeded_order_id;
  end loop;

  insert into public.cash_flow_entries
    (id, user_id, description, type, amount_cents, category, account, due_date, paid_date, status, notes)
  select md5('business-test-v1:' || owner_id::text || ':' || key)::uuid,
    owner_id, description, 'expense', amount, category, 'Caixa principal',
    today + due_offset, today + paid_offset, status, '[business-test-v1:' || key || '] Despesa fictícia.'
  from (values
    ('wood', '[TESTE] Lote de pinus da Madeireira Pinhal do Vale', 76000, 'Produtos', -8, -8, 'paid'),
    ('fasteners', '[TESTE] Pregos da Fixadores Alto Tietê', 18400, 'Fornecedores', 4, null, 'pending'),
    ('freight', '[TESTE] Frete da Transportes Estrada Sul para Jundiaí', 24000, 'Transporte', 9, null, 'pending')
  ) as sample(key, description, amount, category, due_offset, paid_offset, status)
  on conflict (id) do nothing;

  -- Use o mês de calendário na chave para preservar os exemplos entre execuções.
  for scenario in
    select month.day::date as month_day, sample.*, catalog.id as product_id
    from generate_series(-12, 12) as period(month_offset)
    cross join lateral (select month_start + make_interval(months => period.month_offset) as day) month
    cross join (values
      ('monthly-distribution', 'rota-do-vale@example.com', '[TESTE] Pallet de pinus 120 × 100 cm', 28, 4, false, false),
      ('monthly-food', 'colheita-nova@example.com', '[TESTE] Pallet reforçado 120 × 100 cm', 16, 12, false, false),
      ('monthly-crates', 'maquinas-horizonte@example.com', '[TESTE] Caixa de madeira 80 × 60 cm', 9, 21, true, false),
      ('monthly-distribution', 'bebidas-serra-clara@example.com', '[TESTE] Meio pallet 80 × 60 cm', 32, 5, false, true),
      ('monthly-food', 'ceramica-vila-nova@example.com', '[TESTE] Pallet de eucalipto 120 × 100 cm', 20, 13, false, true),
      ('monthly-crates', 'autopecas-rota-oeste@example.com', '[TESTE] Engradado de madeira 100 × 80 cm', 12, 22, true, true)
    ) as sample(key, email, product_name, base_quantity, due_offset, can_cancel, extended_period)
    join public.produtos catalog on catalog.nome = sample.product_name
    where sample.extended_period = (abs(period.month_offset) > 6)
  loop
    request_key := md5('business-test-v1:' || owner_id::text || ':' || scenario.key || ':' || to_char(scenario.month_day, 'YYYY-MM'))::uuid;
    if exists (select from public.pedidos p where p.financial_user_id = owner_id and p.request_id = request_key) then
      continue;
    end if;

    due_day := scenario.month_day + scenario.due_offset;
    sale_day := least(today, due_day - 3);
    settlement_day := due_day + 1;
    select id into strict client from public.clientes where email = scenario.email;
    select preco * 100 * (scenario.base_quantity + extract(month from due_day)::int)
    into strict historical_order_cents from public.produtos where id = scenario.product_id;

    -- Os gatilhos calculam o preço do item e geram o lançamento vinculado.
    -- O cabeçalho recebe a data histórica já na criação para aparecer no gráfico de vendas.
    insert into public.pedidos
      (created_at, id_cliente, id_produto, qtde, status, financial_user_id, due_date, total_cents, request_id)
    values ((sale_day + time '09:00') at time zone 'America/Sao_Paulo', client.id, scenario.product_id,
      scenario.base_quantity + extract(month from due_day)::int, 'P', owner_id, due_day, historical_order_cents, request_key)
    returning id into seeded_order_id;

    insert into public.pedido_itens (id_pedido, id_produto, qtde)
    select p.id, p.id_produto, p.qtde from public.pedidos p where p.id = seeded_order_id;

    if settlement_day <= today then
      update public.pedidos
      set status = case when scenario.can_cancel and extract(month from due_day)::int % 2 = 0 then 'C' else 'E' end
      where id = seeded_order_id;
    end if;

    update public.cash_flow_entries as cash
    set notes = '[business-test-v1:monthly-order] ' || to_char(scenario.month_day, 'MM/YYYY'),
        status = case when settlement_day <= today and cash.status = 'pending' then 'paid' else cash.status end,
        paid_date = case when settlement_day <= today and cash.status = 'pending' then settlement_day end
    where cash.order_id = seeded_order_id;
  end loop;

  insert into public.cash_flow_entries
    (id, user_id, description, type, amount_cents, category, account, due_date, paid_date, status, notes)
  select md5('business-test-v1:' || owner_id::text || ':' || sample.key || ':' || to_char(month.day, 'YYYY-MM'))::uuid,
    owner_id, sample.description || ' · ' || to_char(month.day, 'MM/YYYY'), 'expense',
    sample.amount + extract(month from month.day)::int * sample.monthly_variation, sample.category, 'Caixa principal',
    due.day, case when due.day <= today then due.day end,
    case when due.day <= today then 'paid' else 'pending' end, '[business-test-v1:monthly-expense] Despesa fictícia.'
  from generate_series(month_start - interval '6 months', month_start + interval '6 months', interval '1 month') as month(day)
  cross join (values
    ('monthly-rent', '[TESTE] Aluguel do galpão', 180000, 0, 'Aluguel', 3),
    ('monthly-wood', '[TESTE] Reposição de pinus da Madeireira Pinhal do Vale', 76000, 1400, 'Produtos', 8),
    ('monthly-freight', '[TESTE] Frete da Transportes Estrada Sul', 24000, 350, 'Transporte', 15)
  ) as sample(key, description, amount, monthly_variation, category, due_offset)
  cross join lateral (select month.day::date + sample.due_offset as day) due
  on conflict (id) do nothing;
end;
$seed$;
