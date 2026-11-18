-- Dados temporários; executar após a migration, em uma única chamada como postgres.
begin;
set local plpgsql.check_asserts = on;
select set_config('test.owner', (select id::text from auth.users order by id limit 1), true);
select set_config('test.other', (select id::text from auth.users order by id offset 1 limit 1), true);
select set_config('request.jwt.claim.sub', current_setting('test.owner'), true);
set local role authenticated;
do $$
declare
  customer bigint; a bigint; b bigint; c bigint; z bigint; order_key bigint;
  cart jsonb; denied boolean; receipt uuid;
begin
  insert into public.clientes(nome) values ('TESTE ACRÉSCIMO - cliente') returning id into customer;
  insert into public.produtos(nome,preco,quantidade_pronta_entrega) values ('TESTE ACRÉSCIMO - A',12,20) returning id into a;
  insert into public.produtos(nome,preco,quantidade_pronta_entrega) values ('TESTE ACRÉSCIMO - B',25,20) returning id into b;
  insert into public.produtos(nome,preco,quantidade_pronta_entrega) values ('TESTE ACRÉSCIMO - C',7,20) returning id into c;
  insert into public.produtos(nome,preco,quantidade_pronta_entrega) values ('TESTE ACRÉSCIMO - grátis',0,20) returning id into z;
  cart := jsonb_build_array(jsonb_build_object('id_produto',a,'qtde',2));
  order_key := public.save_order_items(customer,cart,p_due_date := date '2026-12-10',p_request_id := gen_random_uuid());
  select id into strict receipt from public.cash_flow_entries where order_id = order_key;
  update public.produtos set preco = 999 where id = a;
  cart := cart || jsonb_build_array(jsonb_build_object('id_produto',b,'qtde',3));
  assert public.save_order_items(customer,cart,'E',order_key) = order_key;
  assert (select total_cents = 9900 and status = 'E' from public.pedidos where id = order_key);
  assert (select unit_price_cents = 1200 and qtde = 2 from public.pedido_itens where id_pedido = order_key and id_produto = a);
  assert (select amount_cents = 9900 and status = 'pending' and due_date = date '2026-12-10' from public.cash_flow_entries where id = receipt);
  assert public.save_order_items(customer,cart,'E',order_key) = order_key;
  assert (select count(*) = 1 from public.cash_flow_entries where order_id = order_key);
  assert (select count(*) = 2 from public.pedido_itens where id_pedido = order_key);
  cart := cart || jsonb_build_array(jsonb_build_object('id_produto',z,'qtde',1));
  perform public.save_order_items(customer,cart,'E',order_key);
  assert (select total_cents = 9900 from public.pedidos where id = order_key);
  set constraints all immediate;
  set constraints all deferred;

  denied := false;
  begin
    perform public.save_order_items(customer,jsonb_build_array(jsonb_build_object('id_produto',a,'qtde',1)),'C',order_key);
  exception when raise_exception then denied := true; end;
  assert denied, 'Não pode editar itens e cancelar o pedido na mesma operação';

  denied := false;
  begin
    perform public.save_order_items(customer,cart || jsonb_build_array(jsonb_build_object('id_produto',c,'qtde',9007199254740991)),'E',order_key);
  exception when raise_exception then denied := true; end;
  assert denied, 'Overflow aborta o acréscimo inteiro';
  assert not exists(select 1 from public.pedido_itens where id_pedido = order_key and id_produto = c);
  assert (select amount_cents = 9900 from public.cash_flow_entries where id = receipt);

  denied := false;
  begin
    insert into public.pedido_itens(id_pedido,id_produto,qtde) values(order_key,c,1);
    set constraints all immediate;
  exception when raise_exception then denied := true; end;
  assert denied, 'Insert direto sem sincronizar totais deve falhar';

  denied := false;
  begin
    update public.cash_flow_entries set amount_cents = 10000 where id = receipt;
  exception when raise_exception then denied := true; end;
  assert denied, 'O caixa não pode editar o valor da venda';

  perform set_config('request.jwt.claim.sub',current_setting('test.other'),true);
  denied := false;
  begin
    perform public.save_order_items(customer,cart || jsonb_build_array(jsonb_build_object('id_produto',c,'qtde',1)),'E',order_key);
  exception when insufficient_privilege then denied := true; end;
  assert denied, 'Outro usuário não pode acrescentar produtos';
  perform set_config('request.jwt.claim.sub',current_setting('test.owner'),true);

  update public.cash_flow_entries set status = 'paid', paid_date = current_date where id = receipt;
  denied := false;
  begin
    perform public.save_order_items(customer,cart || jsonb_build_array(jsonb_build_object('id_produto',c,'qtde',1)),'E',order_key);
  exception when raise_exception then denied := true; end;
  assert denied, 'Recebimento realizado bloqueia acréscimos';
  update public.pedidos set status = 'C' where id = order_key;
  assert (select amount_cents = 9900 and status = 'paid' from public.cash_flow_entries where id = receipt);
  denied := false;
  begin
    insert into public.pedido_itens(id_pedido,id_produto,qtde) values(order_key,c,1);
  exception when raise_exception then denied := true; end;
  assert denied, 'Pedido cancelado bloqueia insert direto';
  set constraints all immediate;
end;
$$;
select 'OK: acréscimos, preços históricos, retry, rollback, totais, pagamento e RLS' as validation;
rollback;
