export function parsePositiveInteger(value: string): number | null {
    const text = value.trim();
    const number = Number(text);
    return /^\d+$/.test(text) && Number.isSafeInteger(number) && number > 0
        ? number
        : null;
}
