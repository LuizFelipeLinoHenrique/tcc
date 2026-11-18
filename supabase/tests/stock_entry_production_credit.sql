begin;
select set_config('test.first', (select id::text from auth.users order by id limit 1), true);
select set_config('test.second', (select id::text from auth.users order by id offset 1 limit 1), true);
select set_config('request.jwt.claim.sub', current_setting('test.first'), true);
set local role authenticated;
do $test$
declare customer bigint; a bigint; b bigint; first_order bigint; second_order bigint; cart_a jsonb; cart_b jsonb;
begin
  insert into public.clientes(nome) values ('Validação temporária de produção') returning id into customer;
  insert into public.produtos(nome, preco, quantidade_pronta_entrega) values ('Validação temporária A', 10, 0) returning id into a;
  insert into public.produtos(nome, preco, quantidade_pronta_entrega) values ('Validação temporária B', 10, 0) returning id into b;
  cart_a := jsonb_build_array(jsonb_build_object('id_produto',a,'qtde',5));
  cart_b := jsonb_build_array(jsonb_build_object('id_produto',b,'qtde',4), jsonb_build_object('id_produto',a,'qtde',2));
  first_order := public.save_order_items(customer, cart_a, p_due_date := current_date, p_request_id := gen_random_uuid());
  update public.cash_flow_entries set status='paid',paid_date=current_date where order_id=first_order;
  set constraints all immediate;
  set constraints all deferred;
  perform set_config('request.jwt.claim.sub', current_setting('test.second'), true);
  second_order := public.save_order_items(customer, cart_b, p_due_date := current_date, p_request_id := gen_random_uuid());
  if public.adjust_product_ready_stock(a, 3, a || '-partial') is distinct from 0 then raise exception 'Entrada parcial foi para estoque'; end if;
  if not exists (select 1 from public.produtos where id=a and quantidade_pronta_entrega=0 and quantidade_a_produzir=4)
    or not exists (select 1 from public.produtos where id=b and quantidade_a_produzir=4) then raise exception 'Abatimento parcial incorreto'; end if;
  if public.adjust_product_ready_stock(a, 3, a || '-partial') is distinct from 0 then raise exception 'Reenvio incorreto'; end if;
  if public.adjust_product_ready_stock(a, 6, a || '-surplus') is distinct from 2 then raise exception 'Excedente incorreto'; end if;
  perform public.save_order_items(customer, cart_b, 'C', second_order);
  if not exists (select 1 from public.produtos where id=a and quantidade_pronta_entrega=4 and quantidade_a_produzir=0)
    or not exists (select 1 from public.produtos where id=b and quantidade_pronta_entrega=0 and quantidade_a_produzir=0) then raise exception 'Cancelamento incorreto'; end if;
end;
$test$;
set constraints all immediate;
rollback;
select 'Abatimento parcial, excedente, reenvio e cancelamento verificados' as validation;
