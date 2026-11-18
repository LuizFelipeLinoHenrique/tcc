alter table public.produtos
  add column quantidade_a_produzir bigint not null default 0
  check (quantidade_a_produzir >= 0);

-- Itens registrados com a regra anterior foram atendidos integralmente pelo estoque.
alter table public.pedido_itens
  add column qtde_a_produzir bigint not null default 0
  check (qtde_a_produzir between 0 and qtde);

create or replace function public.sync_order_item_stock() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  order_id bigint;
  product_id bigint;
  quantity_delta bigint;
  previous_shortage bigint := 0;
  stock_delta bigint;
  shortage_delta bigint;
  available bigint;
begin
  if tg_op = 'DELETE' then
    order_id := old.id_pedido;
    product_id := old.id_produto;
    quantity_delta := -old.qtde;
  else
    order_id := new.id_pedido;
    product_id := new.id_produto;
    quantity_delta := new.qtde;
  end if;

  if tg_op <> 'INSERT' then previous_shortage := old.qtde_a_produzir; end if;
  if tg_op = 'UPDATE' then quantity_delta := new.qtde - old.qtde; end if;

  if quantity_delta <> 0 and exists (
    select 1 from public.pedidos
    where id = order_id and controla_estoque and status <> 'C'
  ) then
    if quantity_delta > 0 then
      select quantidade_pronta_entrega into available
      from public.produtos where id = product_id for no key update;
      if not found then raise exception 'Produto indisponível: #%', product_id; end if;
      stock_delta := least(quantity_delta, available);
      shortage_delta := quantity_delta - stock_delta;
    else
      -- Uma redução elimina primeiro a parte que ainda precisa ser produzida.
      shortage_delta := greatest(quantity_delta, -previous_shortage);
      stock_delta := quantity_delta - shortage_delta;
    end if;

    update public.produtos
    set quantidade_pronta_entrega = quantidade_pronta_entrega - stock_delta,
        quantidade_a_produzir = quantidade_a_produzir + shortage_delta
    where id = product_id;
    if not found then raise exception 'Não foi possível ajustar o produto #%', product_id; end if;
    previous_shortage := previous_shortage + shortage_delta;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  new.qtde_a_produzir := previous_shortage;
  return new;
end;
$$;

drop trigger sync_order_item_stock on public.pedido_itens;
create trigger sync_order_item_stock
before insert or update or delete on public.pedido_itens
for each row execute function public.sync_order_item_stock();

create or replace function public.restore_cancelled_order_stock() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare item record;
begin
  for item in
    select id_produto, qtde, qtde_a_produzir from public.pedido_itens
    where id_pedido = new.id order by id_produto
  loop
    update public.produtos
    set quantidade_pronta_entrega = quantidade_pronta_entrega + item.qtde - item.qtde_a_produzir,
        quantidade_a_produzir = quantidade_a_produzir - item.qtde_a_produzir
    where id = item.id_produto;
    if not found then
      raise exception 'Não foi possível devolver o produto #% ao estoque', item.id_produto;
    end if;
  end loop;
  return new;
end;
$$;
