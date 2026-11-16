export type OrderItem = { id_produto: number; qtde: number; unit_price_cents?: number | null };

export function orderItems(order: { itens?: OrderItem[] | null; id_produto: number; qtde: number }): OrderItem[] {
    return order.itens?.length ? order.itens : [{ id_produto: order.id_produto, qtde: order.qtde }];
}

export function orderQuantity(order: Parameters<typeof orderItems>[0]): number {
    return orderItems(order).reduce((total, item) => total + Number(item.qtde ?? 0), 0);
}
