-- Preserve existing orders whose customer record is missing.
-- Validate this constraint in a later migration after restoring their customer links.
alter table public.pedidos
  add constraint pedidos_id_cliente_fkey
    foreign key (id_cliente) references public.clientes(id) on delete restrict not valid,
  add constraint pedidos_id_produto_fkey
    foreign key (id_produto) references public.produtos(id) on delete restrict;

create index pedidos_id_cliente_idx on public.pedidos (id_cliente);
create index pedidos_id_produto_idx on public.pedidos (id_produto);

notify pgrst, 'reload schema';
