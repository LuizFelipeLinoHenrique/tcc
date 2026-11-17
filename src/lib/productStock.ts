export const readyStockLabel = "Quantidade para pronta entrega";
export const readyStockError = "Informe uma quantidade inteira entre 0 e 2.147.483.647.";

export function parseReadyStock(value: string): number | null {
    const input = value.trim();
    const quantity = Number(input || "0");
    return /^\d*$/.test(input) && quantity <= 2147483647 ? quantity : null;
}
