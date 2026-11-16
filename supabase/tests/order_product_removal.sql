begin;
set local plpgsql.check_asserts = on;
select set_config('test.owner', (select id::text from auth.users order by id limit 1), true);
select set_config('test.other', (select id::text from auth.users order by id offset 1 limit 1), true);
select set_config('request.jwt.claim.sub', current_setting('test.owner'), true);
set local role authenticated;
do $$
declare customer bigint; a bigint; b bigint; c bigint; order_key bigint; receipt uuid; cart jsonb; denied boolean;
begin
  insert into public.clientes(nome) values ('TESTE REMOÇÃO - cliente') returning id into customer;
  insert into public.produtos(nome,preco) values ('TESTE REMOÇÃO - A',12) returning id into a;
  insert into public.produtos(nome,preco) values ('TESTE REMOÇÃO - B',25) returning id into b;
  insert into public.produtos(nome,preco) values ('TESTE REMOÇÃO - C',7) returning id into c;
  cart := jsonb_build_array(jsonb_build_object('id_produto',a,'qtde',2),jsonb_build_object('id_produto',b,'qtde',3));
  order_key := public.save_order_items(customer,cart,p_due_date := date '2026-12-10',p_request_id := gen_random_uuid());
  select id into strict receipt from public.cash_flow_entries where order_id = order_key;
  update public.produtos set preco = 999 where id = b;
  cart := jsonb_build_array(jsonb_build_object('id_produto',b,'qtde',3));
  perform public.save_order_items(customer,cart,'P',order_key);
  assert not exists(select 1 from public.pedido_itens where id_pedido = order_key and id_produto = a);
  assert (select total_cents = 7500 and id_produto = b and qtde = 3 from public.pedidos where id = order_key);
  assert (select unit_price_cents = 2500 from public.pedido_itens where id_pedido = order_key and id_produto = b);
  assert (select amount_cents = 7500 and status = 'pending' from public.cash_flow_entries where id = receipt);
  perform public.save_order_items(customer,cart,'P',order_key);
  assert (select count(*) = 1 from public.pedido_itens where id_pedido = order_key);
  set constraints all immediate;
  set constraints all deferred;

  denied := false;
  begin perform public.save_order_items(customer,'[]'::jsonb,'P',order_key);
  exception when raise_exception then denied := true; end;
  assert denied, 'Não pode remover todos os produtos';
  denied := false;
  begin
    delete from public.pedido_itens where id_pedido = order_key;
    set constraints all immediate;
  exception when raise_exception then denied := true; end;
  assert denied, 'Delete direto sem sincronizar totais deve falhar';
  assert (select amount_cents = 7500 from public.cash_flow_entries where id = receipt);

  -- Substitui o único item e atualiza cabeçalho e caixa na mesma operação.
  cart := jsonb_build_array(jsonb_build_object('id_produto',c,'qtde',2),jsonb_build_object('id_produto',a,'qtde',1));
  perform public.save_order_items(customer,cart,'E',order_key);
  assert (select total_cents = 2600 from public.pedidos where id = order_key);
  assert (select amount_cents = 2600 and status = 'pending' from public.cash_flow_entries where id = receipt);
  set constraints all immediate;
  set constraints all deferred;
  perform set_config('request.jwt.claim.sub',current_setting('test.other'),true);
  denied := false;
  begin delete from public.pedido_itens where id_pedido = order_key and id_produto = a;
  exception when insufficient_privilege then denied := true; end;
  assert denied, 'Outro usuário não pode remover produtos';
  perform set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
  update public.cash_flow_entries set status = 'paid', paid_date = current_date where id = receipt;
  denied := false;
  begin perform public.save_order_items(customer,jsonb_build_array(jsonb_build_object('id_produto',c,'qtde',2)),'E',order_key);
  exception when raise_exception then denied := true; end;
  assert denied, 'Pedido pago bloqueia remoção';
  denied := false;
  begin delete from public.pedido_itens where id_pedido = order_key and id_produto = a;
  exception when raise_exception then denied := true; end;
  assert denied, 'Pedido pago bloqueia delete direto';
  set constraints all immediate;
end;
$$;
select 'OK: remoção, primeiro produto, preço histórico, retry, substituição, totais, rollback e bloqueios' as validation;
rollback;
