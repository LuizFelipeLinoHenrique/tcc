create schema stock_adjustments;
grant usage on schema stock_adjustments to authenticated;

-- A chave impede que uma tentativa repetida desconte ou some unidades de novo.
create table stock_adjustments.requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_key text not null check (length(request_key) between 1 and 128),
  product_id bigint not null,
  delta integer not null,
  result integer not null,
  primary key (user_id, request_key)
);
alter table stock_adjustments.requests enable row level security;
grant select, insert on stock_adjustments.requests to authenticated;
create policy read_own_stock_adjustments on stock_adjustments.requests
  for select to authenticated using ((select auth.uid()) = user_id);
create policy insert_own_stock_adjustments on stock_adjustments.requests
  for insert to authenticated with check ((select auth.uid()) = user_id);

create function public.adjust_product_ready_stock(
  p_product_id bigint, p_delta integer, p_request_key text
) returns integer
language plpgsql security invoker set search_path = '' as $$
declare
  actor uuid := auth.uid();
  previous stock_adjustments.requests;
  current_stock bigint;
  new_stock integer;
begin
  if actor is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  if p_product_id is null or p_product_id <= 0 or p_delta is null or p_delta = 0
    or p_request_key is null or length(p_request_key) not between 1 and 128 then
    raise exception 'Informe o produto e uma quantidade válida';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('stock:' || actor::text || ':' || p_request_key, 0));
  select * into previous from stock_adjustments.requests
  where user_id = actor and request_key = p_request_key;
  if found then
    if (previous.product_id, previous.delta) is distinct from (p_product_id, p_delta) then
      raise exception 'Este lançamento já foi registrado com outros dados';
    end if;
    return previous.result;
  end if;

  select quantidade_pronta_entrega into current_stock
  from public.produtos where id = p_product_id for no key update;
  if not found then raise exception 'Produto indisponível'; end if;
  if current_stock + p_delta < 0 then
    raise exception 'Saldo insuficiente para a saída. Estoque atual: %', current_stock;
  end if;
  if current_stock + p_delta > 2147483647 then
    raise exception 'O saldo ultrapassaria o limite de 2.147.483.647 unidades';
  end if;

  update public.produtos set quantidade_pronta_entrega = current_stock + p_delta
  where id = p_product_id returning quantidade_pronta_entrega into new_stock;
  if not found then raise exception 'Produto indisponível para ajuste'; end if;

  insert into stock_adjustments.requests(user_id, request_key, product_id, delta, result)
  values (actor, p_request_key, p_product_id, p_delta, new_stock);
  return new_stock;
end;
$$;

revoke all on function public.adjust_product_ready_stock(bigint, integer, text) from public, anon;
grant execute on function public.adjust_product_ready_stock(bigint, integer, text) to authenticated;
