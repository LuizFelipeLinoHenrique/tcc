export function parsePositiveInteger(value: string): number | null {
    const text = value.trim();
    const number = Number(text);
    return /^\d+$/.test(text) && Number.isSafeInteger(number) && number > 0
        ? number
        : null;
}

export function orderDateRange(days: number, today = new Date()) {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + 1);
    const dateKey = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { start: dateKey(start), end: dateKey(today) };
}
