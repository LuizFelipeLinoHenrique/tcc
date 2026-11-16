-- Executar como postgres no SQL Editor, após as migrations, em uma única chamada.
-- Usa dois usuários existentes apenas para simular JWT/RLS. Dados de teste sofrem ROLLBACK.
begin;
set local plpgsql.check_asserts = on;
select set_config('test.owner', (select id::text from auth.users order by id limit 1), true);
select set_config('test.other', (select id::text from auth.users order by id offset 1 limit 1), true);
select set_config('request.jwt.claim.sub', current_setting('test.owner'), true);
set local role authenticated;

do $$
declare
  client_id bigint; product_a bigint; product_b bigint; single_id bigint; multi_id bigint;
  retry_id bigint; failed_id bigint; legacy public.pedidos;
  request_key uuid := gen_random_uuid(); cart jsonb; cash public.cash_flow_entries;
  old_orders bigint; old_cash bigint; denied boolean;
begin
  if auth.uid() is null or nullif(current_setting('test.other'), '') is null then
    raise exception 'São necessários dois usuários existentes para validar RLS';
  end if;
  insert into public.clientes(nome) values ('TESTE TRANSACIONAL - cliente') returning id into client_id;
  insert into public.produtos(nome,preco) values ('TESTE TRANSACIONAL - A',12) returning id into product_a;
  insert into public.produtos(nome,preco) values ('TESTE TRANSACIONAL - B',25) returning id into product_b;
  single_id := public.save_order_items(client_id,jsonb_build_array(jsonb_build_object('id_produto',product_a,'qtde',3)),
    p_due_date := date '2026-11-20', p_request_id := gen_random_uuid());
  select * into strict cash from public.cash_flow_entries where order_id = single_id;
  assert cash.amount_cents = 3600 and cash.status = 'pending' and cash.type = 'income';
  assert cash.category = 'Vendas' and cash.due_date = date '2026-11-20' and cash.paid_date is null;
  assert cash.user_id = auth.uid() and cash.description like '%' || single_id::text;

  cart := jsonb_build_array(jsonb_build_object('id_produto',product_a,'qtde',2),jsonb_build_object('id_produto',product_b,'qtde',4));
  multi_id := public.save_order_items(client_id,cart,p_due_date := date '2026-12-10',p_request_id := request_key);
  assert (select amount_cents = 12400 from public.cash_flow_entries where order_id = multi_id);
  assert (select count(*) = 2 from public.pedido_itens where id_pedido = multi_id);
  retry_id := public.save_order_items(client_id,cart,p_due_date := date '2026-12-10',p_request_id := request_key);
  assert retry_id = multi_id;
  assert (select count(*) = 1 from public.cash_flow_entries where order_id = multi_id);

  denied := false;
  begin
    perform public.save_order_items(client_id,cart,p_due_date := date '2026-12-11',p_request_id := request_key);
  exception when raise_exception then denied := true; end;
  assert denied, 'Chave repetida com payload diferente deve falhar';

  update public.produtos set preco = 999 where id = product_a;
  assert (select unit_price_cents = 1200 from public.pedido_itens where id_pedido = single_id);
  assert (select amount_cents = 3600 from public.cash_flow_entries where order_id = single_id);
  -- Entrega não é recebimento.
  update public.pedidos set status = 'E' where id = single_id;
  assert (select status = 'pending' from public.cash_flow_entries where order_id = single_id);
  update public.cash_flow_entries set status = 'paid', paid_date = (now() at time zone 'America/Sao_Paulo')::date
    where order_id = single_id;
  update public.pedidos set status = 'C' where id = single_id;
  assert (select status = 'paid' and amount_cents = 3600 from public.cash_flow_entries where order_id = single_id);
  update public.pedidos set status = 'C' where id = multi_id;
  assert (select status = 'cancelled' and paid_date is null from public.cash_flow_entries where order_id = multi_id);
  -- Repetir uma requisição antiga não reabre o pedido cancelado.
  assert public.save_order_items(client_id,cart,p_due_date := date '2026-12-10',p_request_id := request_key) = multi_id;
  assert (select status = 'C' from public.pedidos where id = multi_id);

  denied := false;
  begin
    update public.cash_flow_entries set status = 'cancelled', paid_date = null where order_id = single_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Recebimento realizado não pode ser estornado';
  denied := false;
  begin
    update public.cash_flow_entries set amount_cents = 1 where order_id = single_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Valor vinculado não pode divergir';
  denied := false;
  begin
    delete from public.cash_flow_entries where order_id = single_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Histórico financeiro não pode ser apagado';
  denied := false;
  begin
    delete from public.pedidos where id = single_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Pedido integrado não pode ser apagado';
  denied := false;
  begin
    update public.pedido_itens set qtde = qtde + 1 where id_pedido = single_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Itens registrados devem ser preservados';
  denied := false;
  begin
    insert into public.cash_flow_entries(user_id,order_id,description,type,amount_cents,category,account,due_date)
    select user_id,order_id,description,type,amount_cents,category,account,due_date from public.cash_flow_entries where order_id = single_id;
  exception when unique_violation then denied := true; end;
  assert denied, 'Índice único deve impedir recebimento duplicado';

  -- O cabeçalho e o caixa são inseridos; a inconsistência dos itens aborta ambos.
  select count(*) into old_orders from public.pedidos;
  select count(*) into old_cash from public.cash_flow_entries;
  denied := false;
  begin
    insert into public.pedidos(id_cliente,id_produto,qtde,status,financial_user_id,due_date,total_cents,request_id)
    values(client_id,product_b,1,'P',auth.uid(),date '2026-11-20',1,gen_random_uuid()) returning id into failed_id;
    insert into public.pedido_itens(id_pedido,id_produto,qtde) values(failed_id,product_b,1);
    set constraints all immediate;
  exception when raise_exception then denied := true; end;
  assert denied, 'A inconsistência deve abortar a transação';
  assert (select count(*) = old_orders from public.pedidos);
  assert (select count(*) = old_cash from public.cash_flow_entries);
  assert not exists (select 1 from public.pedido_itens where id_pedido = failed_id);

  -- Vencimento fora do intervalo também não persiste pedido.
  denied := false;
  begin
    perform public.save_order_items(client_id,cart,p_due_date := date '1800-01-01',p_request_id := gen_random_uuid());
  exception when check_violation then denied := true; end;
  assert denied;
  assert (select count(*) = old_orders from public.pedidos);

  -- Isolamento entre usuários: pedidos compartilhados não dão acesso ao caixa alheio.
  perform set_config('request.jwt.claim.sub',current_setting('test.other'),true);
  assert not exists (select 1 from public.cash_flow_entries where order_id in (single_id,multi_id));
  update public.cash_flow_entries set notes = 'Não permitido' where order_id = single_id;
  assert not found;
  denied := false;
  begin
    update public.pedidos set status = 'P' where id = single_id;
  exception when insufficient_privilege then denied := true; end;
  assert denied, 'Outro usuário não pode alterar o pedido integrado';
  perform set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
  assert (select notes = '' from public.cash_flow_entries where order_id = single_id);

  -- Compatibilidade com um pedido legado existente, dentro do ROLLBACK.
  select * into legacy from public.pedidos where financial_user_id is null and status in ('P','E','C')
    and id_cliente is not null and exists (select 1 from public.pedido_itens i where i.id_pedido = pedidos.id) limit 1;
  if found then
    select jsonb_agg(jsonb_build_object('id_produto',id_produto,'qtde',qtde) order by id_produto)
      into cart from public.pedido_itens where id_pedido = legacy.id;
    assert public.save_order_items(legacy.id_cliente,cart,legacy.status,legacy.id) = legacy.id;
    assert not exists(select 1 from public.cash_flow_entries where order_id = legacy.id);
  end if;
  set constraints all immediate;
end;
$$;
select 'OK: integração, histórico, rollback e RLS validados; dados de teste revertidos ao final' as validation;
rollback;
