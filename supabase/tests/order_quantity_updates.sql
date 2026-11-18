begin;
set local plpgsql.check_asserts = on;
select set_config('request.jwt.claim.sub', (select id::text from auth.users order by id limit 1), true);
set local role authenticated;
do $$
declare c bigint; a bigint; b bigint; k bigint; cart jsonb; denied boolean;
begin
 insert into public.clientes(nome) values ('TESTE QUANTIDADE') returning id into c;
 insert into public.produtos(nome,preco,quantidade_pronta_entrega) values ('TESTE QUANTIDADE A',12,20) returning id into a;
 insert into public.produtos(nome,preco,quantidade_pronta_entrega) values ('TESTE QUANTIDADE B',25,20) returning id into b;
 k := public.save_order_items(c,jsonb_build_array(jsonb_build_object('id_produto',a,'qtde',2),jsonb_build_object('id_produto',b,'qtde',3)),p_due_date := current_date,p_request_id := gen_random_uuid());
 update public.produtos set preco = 999 where id in (a,b);
 cart := jsonb_build_array(jsonb_build_object('id_produto',a,'qtde',4),jsonb_build_object('id_produto',b,'qtde',1));
 perform public.save_order_items(c,cart,'E',k);
 assert (select total_cents = 7300 and qtde = 4 from public.pedidos where id = k);
 assert (select quantidade_pronta_entrega = 16 from public.produtos where id = a);
 assert (select quantidade_pronta_entrega = 19 from public.produtos where id = b);
 assert (select amount_cents = 7300 from public.cash_flow_entries where order_id = k);
 assert (select unit_price_cents = 1200 and qtde = 4 from public.pedido_itens where id_pedido = k and id_produto = a);
 set constraints all immediate;
 set constraints all deferred;
 perform public.save_order_items(c,cart,'E',k);
 assert (select quantidade_pronta_entrega = 16 from public.produtos where id = a);
 assert (select quantidade_pronta_entrega = 19 from public.produtos where id = b);
 denied := false;
 begin
  update public.pedido_itens set qtde = 8 where id_pedido = k and id_produto = a;
  set constraints all immediate;
 exception when raise_exception then denied := true;
 end;
 assert denied, 'Alteracao direta sem sincronizar totais deve falhar';
 update public.cash_flow_entries set status = 'paid', paid_date = current_date where order_id = k;
 denied := false;
 begin
  perform public.save_order_items(c,jsonb_build_array(jsonb_build_object('id_produto',a,'qtde',5),jsonb_build_object('id_produto',b,'qtde',1)),'E',k);
 exception when raise_exception then denied := true;
 end;
 assert denied, 'Pedido pago bloqueia alteracao';
 set constraints all immediate;
end;
$$;
select 'OK: quantidades, preco historico, totais, retry e bloqueios' as validation;
rollback;
