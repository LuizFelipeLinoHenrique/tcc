import { cashToday, isoDate, parseDate } from "./cashFlow";
import { displayDate } from "./dates";

type OrderDate = { data_pedido?: string | null; created_at?: string | null };

export function dashboardOrders(orders: OrderDate[], monthsCount: number, today = cashToday()) {
    const totals = new Map<string, number>();
    for (const order of orders) {
        const day = parseDate(displayDate(order.data_pedido?.trim() || order.created_at));
        if (!day || day > today) continue;

        const month = day.slice(0, 7);
        totals.set(month, (totals.get(month) ?? 0) + 1);
    }

    const [year, month] = today.split("-").map(Number);
    return Array.from({ length: monthsCount }, (_, index) => {
        const date = new Date(year, month - monthsCount + index, 1, 12);
        return {
            label: date.toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" }),
            value: totals.get(isoDate(date).slice(0, 7)) ?? 0,
        };
    });
}
