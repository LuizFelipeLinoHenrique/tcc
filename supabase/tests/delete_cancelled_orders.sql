-- Como postgres, executar em uma única chamada. Nenhum dado de teste é persistido.
begin;
set local plpgsql.check_asserts = on;
select set_config('test.owner',(select id::text from auth.users order by id limit 1),true);
select set_config('test.other',(select id::text from auth.users where id::text <> current_setting('test.owner') limit 1),true);
select set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
set local role authenticated;
do $$
declare client_id bigint; product_id bigint; unpaid_id bigint; paid_id bigint;
  cart jsonb; denied boolean; before_cash jsonb; manual_id uuid; request_key uuid := gen_random_uuid();
  legacy_id bigint; actual numeric; expected numeric;
begin
  insert into public.clientes(nome) values ('TESTE ROLLBACK - integridade') returning id into client_id;
  insert into public.produtos(nome,preco) values ('TESTE ROLLBACK - integridade',150) returning id into product_id;
  cart := jsonb_build_array(jsonb_build_object('id_produto',product_id,'qtde',1));
  insert into public.cash_flow_entries(description,type,amount_cents,category,account,due_date,status,paid_date)
  values('TESTE ROLLBACK - manual','income',1000,'Vendas','Caixa principal',current_date,'paid',(now() at time zone 'America/Sao_Paulo')::date)
  returning id into manual_id;
  unpaid_id := public.save_order_items(client_id,cart,p_due_date := date '2026-12-01',p_request_id := request_key);
  denied := false;
  begin perform public.delete_cancelled_order(unpaid_id);
  exception when raise_exception then denied := true; end;
  assert denied, 'Pendente não pode ser excluído';
  update public.pedidos set status = 'E' where id = unpaid_id;
  denied := false;
  begin delete from public.pedidos where id = unpaid_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Entregue não pode ser excluído nem por DELETE direto';
  update public.pedidos set status = 'C' where id = unpaid_id;
  assert (select status = 'cancelled' from public.cash_flow_entries where order_id = unpaid_id);
  denied := false;
  begin delete from public.cash_flow_entries where order_id = unpaid_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Não se pode apagar primeiro o caixa para contornar a regra';

  paid_id := public.save_order_items(client_id,cart,p_due_date := date '2026-12-01',p_request_id := gen_random_uuid());
  update public.cash_flow_entries set status = 'paid',paid_date = (now() at time zone 'America/Sao_Paulo')::date where order_id = paid_id;
  select to_jsonb(c) into before_cash from public.cash_flow_entries c where order_id = paid_id;
  select coalesce(sum(amount_cents),0) into actual from public.cash_flow_entries where status = 'paid';
  select coalesce(sum(amount_cents),0) into expected from public.cash_flow_entries where status = 'pending';
  update public.pedidos set status = 'C' where id = paid_id;
  assert (select to_jsonb(c) = before_cash and status = 'paid' from public.cash_flow_entries c where order_id = paid_id),
    'Cancelamento deve preservar todos os campos do recebimento de R$150';
  assert (select coalesce(sum(amount_cents),0) = actual from public.cash_flow_entries where status = 'paid');
  assert (select coalesce(sum(amount_cents),0) = expected from public.cash_flow_entries where status = 'pending');

  denied := false;
  begin perform public.delete_cancelled_order(paid_id);
  exception when raise_exception then
    assert sqlerrm like 'Pedido com recebimento realizado%', sqlerrm;
    denied := true;
  end;
  assert denied, 'RPC deve bloquear exclusão de pedido pago cancelado';
  denied := false;
  begin delete from public.pedidos where id = paid_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'DELETE direto deve bloquear pedido pago';
  denied := false;
  begin update public.pedidos set deleted_at = now() where id = paid_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Pedido pago também não pode ser ocultado por exclusão lógica';
  denied := false;
  begin update public.cash_flow_entries set status = 'cancelled',paid_date = null where order_id = paid_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Recebimento não pode ser revertido para permitir exclusão';
  denied := false;
  begin delete from public.cash_flow_entries where order_id = paid_id;
  exception when raise_exception then denied := true; end;
  assert denied, 'Recebimento realizado não pode ser excluído separadamente';
  assert (select status = 'C' and deleted_at is null from public.pedidos where id = paid_id);

  -- Falha de um DELETE em lote reverte qualquer remoção anterior do lote.
  denied := false;
  begin delete from public.pedidos where id in (unpaid_id,paid_id);
  exception when raise_exception then denied := true; end;
  assert denied;
  assert exists(select 1 from public.pedidos where id = unpaid_id);
  assert exists(select 1 from public.pedido_itens where id_pedido = unpaid_id);
  assert exists(select 1 from public.cash_flow_entries where order_id = unpaid_id);

  perform set_config('request.jwt.claim.sub',current_setting('test.other'),true);
  assert not exists(select 1 from public.cash_flow_entries where order_id in (paid_id,unpaid_id));
  denied := false;
  begin perform public.delete_cancelled_order(unpaid_id);
  exception when insufficient_privilege then denied := true; end;
  assert denied, 'RLS não pode ser contornada ao excluir pedido compartilhado';
  perform set_config('request.jwt.claim.sub',current_setting('test.owner'),true);

  assert public.delete_cancelled_order(unpaid_id) = unpaid_id;
  assert not exists(select 1 from public.pedidos where id = unpaid_id), 'Cabeçalho deve ser removido definitivamente';
  assert not exists(select 1 from public.pedido_itens where id_pedido = unpaid_id), 'Não podem sobrar itens';
  assert not exists(select 1 from public.cash_flow_entries where order_id = unpaid_id), 'Não pode sobrar vínculo financeiro';
  assert (select to_jsonb(c) = before_cash from public.cash_flow_entries c where order_id = paid_id);
  assert (select coalesce(sum(amount_cents),0) = actual from public.cash_flow_entries where status = 'paid');
  assert (select coalesce(sum(amount_cents),0) = expected from public.cash_flow_entries where status = 'pending');
  assert exists(select 1 from public.cash_flow_entries where id = manual_id and status = 'paid');

  -- Registros legados seguem sem recebimento retroativo e podem ser excluídos após cancelar.
  select id into legacy_id from public.pedidos where financial_user_id is null and deleted_at is null
    and not exists(select 1 from public.cash_flow_entries where order_id = pedidos.id) limit 1;
  if found then
    update public.pedidos set status = 'C' where id = legacy_id;
    assert public.delete_cancelled_order(legacy_id) = legacy_id;
    assert not exists(select 1 from public.pedidos where id = legacy_id);
    assert not exists(select 1 from public.pedido_itens where id_pedido = legacy_id);
  end if;
  set constraints all immediate;
end;
$$;
select 'OK: cancelamento pago preservado; exclusão paga bloqueada; exclusão não paga sem resíduos; RLS e saldos preservados' as validation;
rollback;
