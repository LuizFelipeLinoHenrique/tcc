-- Itens separados do cabeçalho; colunas legadas preservam o primeiro item.
create table public.pedido_itens (
    id_pedido bigint not null references public.pedidos(id) on delete cascade,
    id_produto bigint not null references public.produtos(id) on delete restrict,
    qtde bigint not null check (qtde > 0 and qtde <= 9007199254740991),
    primary key (id_pedido, id_produto)
);
create index pedido_itens_produto_idx on public.pedido_itens(id_produto);
alter table public.pedido_itens enable row level security;
-- Os pedidos atuais são compartilhados. Respeitar a visibilidade do cabeçalho
-- também permite que futuras restrições de pedidos se apliquem aos itens.
create policy pedido_itens_acesso on public.pedido_itens
    for all to authenticated
    using (exists (select 1 from public.pedidos p where p.id = id_pedido))
    with check (exists (select 1 from public.pedidos p where p.id = id_pedido));
grant select, insert, update, delete on public.pedido_itens to authenticated;

insert into public.pedido_itens(id_pedido, id_produto, qtde)
select p.id, p.id_produto, p.qtde from public.pedidos p
join public.produtos pr on pr.id = p.id_produto
where p.qtde > 0 and p.qtde <= 9007199254740991;

create or replace function public.save_order_items(
    p_cliente bigint, p_itens jsonb, p_status text default 'P', p_pedido bigint default null
) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare
    pedido_id bigint;
    primeiro_produto bigint;
    primeira_qtde bigint;
begin
    if auth.uid() is null then
        raise exception 'Sessão necessária' using errcode = '42501';
    end if;
    if p_cliente is null or p_cliente <= 0 or not exists (select 1 from public.clientes where id = p_cliente) then
        raise exception 'Cliente inválido' using errcode = '23503';
    end if;
    if p_status is null or p_status not in ('P','E','C') or p_itens is null or jsonb_typeof(p_itens) <> 'array' then
        raise exception 'Itens ou status inválidos' using errcode = '23514';
    end if;
    if jsonb_array_length(p_itens) = 0 or exists (
        select 1 from jsonb_array_elements(p_itens) item
        where jsonb_typeof(item) <> 'object'
           or coalesce(item->>'id_produto', '') !~ '^[0-9]+$'
           or coalesce(item->>'qtde', '') !~ '^[0-9]+$'
           or (item->>'id_produto')::numeric not between 1 and 9007199254740991
           or (item->>'qtde')::numeric not between 1 and 9007199254740991
    ) then
        raise exception 'Adicione produtos e quantidades inteiras maiores que zero' using errcode = '23514';
    end if;
    if (select count(distinct (item->>'id_produto')::bigint) from jsonb_array_elements(p_itens) item) <> jsonb_array_length(p_itens) then
        raise exception 'Produto repetido no pedido' using errcode = '23514';
    end if;
    primeiro_produto := (p_itens->0->>'id_produto')::bigint;
    primeira_qtde := (p_itens->0->>'qtde')::bigint;
    if p_pedido is null then
        insert into public.pedidos(id_cliente, id_produto, qtde, status)
        values(p_cliente, primeiro_produto, primeira_qtde, p_status) returning id into pedido_id;
    else
        -- O UPDATE bloqueia o cabeçalho até concluir a substituição dos itens.
        update public.pedidos set id_cliente = p_cliente, id_produto = primeiro_produto,
            qtde = primeira_qtde, status = p_status
        where id = p_pedido returning id into pedido_id;
        if pedido_id is null then
            raise exception 'Pedido indisponível para edição' using errcode = '42501';
        end if;
        delete from public.pedido_itens where id_pedido = pedido_id;
    end if;
    insert into public.pedido_itens(id_pedido, id_produto, qtde)
    select pedido_id, (item->>'id_produto')::bigint, (item->>'qtde')::bigint
    from jsonb_array_elements(p_itens) item;
    return pedido_id;
end;
$$;
revoke all on function public.save_order_items(bigint,jsonb,text,bigint) from public, anon;
grant execute on function public.save_order_items(bigint,jsonb,text,bigint) to authenticated;
