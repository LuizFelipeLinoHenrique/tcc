import { supabase } from "./supabase";

const PAGE_SIZE = 500;

type DashboardRow = {
    id: number;
    nome?: string | null;
    data_pedido?: string | null;
    created_at?: string | null;
    status?: string | null;
    qtde?: number | null;
    quantidade?: number | null;
    id_produto?: number | null;
    id_material?: number | null;
    produto_id?: number | null;
    id_cliente?: number | null;
    cliente_id?: number | null;
    preco?: number | string | null;
    "preço"?: number | string | null;
    preco_unit?: number | string | null;
};

export async function loadDashboardRows(table: "pedidos" | "produtos" | "clientes", columns: string) {
    const rows: DashboardRow[] = [];
    let cursor: number | null = null;

    while (true) {
        let query = supabase.from(table).select(columns).order("id").limit(PAGE_SIZE);
        if (cursor !== null) query = query.gt("id", cursor);

        const { data, error } = await query.overrideTypes<DashboardRow[], { merge: false }>();
        if (error) throw error;
        if (!data?.length) return rows;

        rows.push(...data);
        cursor = data[data.length - 1].id;
    }
}

type TimelineOrder = Pick<DashboardRow, "id" | "data_pedido" | "created_at">;

function monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildTimelineData(
    orders: TimelineOrder[],
    months: number,
    getValue: (order: TimelineOrder) => number = () => 1,
    today = new Date(),
) {
    const totals = new Map<string, number>();

    for (const order of orders) {
        const value = order.data_pedido ?? order.created_at;
        if (!value) continue;

        // A coluna DATE representa um dia do calendário, sem fuso horário.
        const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
        if (!Number.isFinite(date.getTime())) continue;

        const key = monthKey(date);
        totals.set(key, (totals.get(key) ?? 0) + getValue(order));
    }

    return Array.from({ length: months }, (_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth() - months + index + 1, 1);
        return {
            label: date.toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" }),
            value: totals.get(monthKey(date)) ?? 0,
        };
    });
}
