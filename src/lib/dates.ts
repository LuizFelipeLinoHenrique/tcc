const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function calendarDate(year: string, month: string, day: string): string {
  const date = new Date(`${year}-${month}-${day}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) {
    return "Não informada";
  }
  return `${day}/${month}/${year}`;
}

export function displayDate(value?: string | Date | null): string {
  if (value == null || value === "") return "Não informada";
  if (typeof value === "string") {
    const text = value.trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (iso) return calendarDate(iso[1], iso[2], iso[3]);
    const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (local) return calendarDate(local[3], local[2], local[1]);
    // Only timestamps may be interpreted as an instant in the business timezone.
    if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(text)) return "Não informada";
    value = new Date(text);
  }
  return Number.isFinite(value.getTime()) ? dateFormatter.format(value) : "Não informada";
}

export function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}
