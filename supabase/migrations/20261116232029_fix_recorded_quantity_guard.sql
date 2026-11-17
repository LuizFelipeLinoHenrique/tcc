create or replace function public.guard_order_item_finance() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare p public.pedidos; price numeric;
begin
  if tg_op <> 'INSERT' then
    select * into p from public.pedidos where id = old.id_pedido for update;
    if p.financial_user_id is not null then
      if p.financial_user_id is distinct from auth.uid() then
        raise exception 'Pedido indisponível para edição' using errcode = '42501';
      end if;
      perform 1 from public.cash_flow_entries where order_id = p.id and status = 'pending' for update;
      if not found or p.status = 'C' then raise exception 'Itens só podem ser alterados antes do recebimento e do cancelamento'; end if;
      if tg_op = 'UPDATE' then
        if (to_jsonb(new) - 'qtde') is distinct from (to_jsonb(old) - 'qtde') then
          raise exception 'Somente a quantidade pode ser alterada nos itens registrados';
        end if;
        return new;
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  select * into p from public.pedidos where id = new.id_pedido for update;
  if p.financial_user_id is not null then
    if tg_op <> 'INSERT' or p.financial_user_id is distinct from auth.uid() or p.status = 'C' then
      raise exception 'Itens e preços da venda ficam preservados após registrar o pedido';
    end if;
    perform 1 from public.cash_flow_entries where order_id = p.id and status = 'pending' for update;
    if not found then raise exception 'Produtos só podem ser adicionados antes do recebimento'; end if;
    select round(preco::numeric * 100) into price from public.produtos where id = new.id_produto for share;
    if price is null or price < 0 or price > 999999999999 then raise exception 'Produto sem preço válido para venda'; end if;
    new.unit_price_cents := price::bigint;
  end if;
  return new;
end;
$$;
