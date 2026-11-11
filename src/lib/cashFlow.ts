export type CashEntry = {
  id: string;
  user_id: string;
  description: string;
  type: "income" | "expense";
  amount_cents: number;
  category: string;
  account: string;
  due_date: string;
  paid_date: string | null;
  status: "pending" | "paid" | "cancelled";
  notes: string;
  created_at: string;
};

export const cashCategories = ["Vendas", "Serviços", "Aportes", "Saldo inicial", "Materiais", "Fornecedores", "Salários", "Aluguel", "Impostos", "Transporte", "Outros"];
export const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const isoDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const cashDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function cashToday(now = new Date()): string {
  const parts = cashDateFormatter.formatToParts(now);
  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;
  const day = parts.find(part => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export const displayDate = (date: string) => date.split("-").reverse().join("/");

export function parseDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = `${year}-${month}-${day}`;
  const parsed = new Date(`${date}T12:00:00`);
  return Number(year) >= 1900 && Number(year) <= 9999 && !isNaN(parsed.getTime()) && isoDate(parsed) === date ? date : null;
}

export function parseMoney(value: string): number | null {
  const text = value.trim().replace(/^R\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null;
  const [integer, fraction = ""] = text.replace(/\./g, "").split(",");
  const cents = Number(integer) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 999999999999 ? cents : null;
}

export function addMonths(date: string, count: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const last = new Date(year, month - 1 + count + 1, 0).getDate();
  return isoDate(new Date(year, month - 1 + count, Math.min(day, last), 12));
}

export const signedAmount = (entry: CashEntry) => entry.type === "income" ? entry.amount_cents : -entry.amount_cents;
export const effectiveDate = (entry: CashEntry) => entry.status === "paid" ? entry.paid_date! : entry.due_date;

export function cashMonthData(entries: CashEntry[], start: string, end: string, today = cashToday()) {
  const monthlyEntries = entries.filter(entry => {
    const date = effectiveDate(entry);
    return date >= start && date <= end;
  });
  const totals = summarizeCash(entries, start, end, today);
  const balance = totals.income - totals.expense;
  const changes = new Map<string, number>();
  let overdue = 0;
  for (const entry of monthlyEntries) {
    if (entry.status === "cancelled") continue;
    const date = effectiveDate(entry);
    if (entry.status === "pending" && date < today) overdue++;
    changes.set(date, (changes.get(date) ?? 0) + signedAmount(entry));
  }
  let projected = 0;
  const projection: { date: string; balance: number }[] = [];
  const date = new Date(`${start}T12:00:00`);
  while (isoDate(date) <= end) {
    const key = isoDate(date);
    projected += changes.get(key) ?? 0;
    projection.push({ date: key, balance: projected });
    date.setDate(date.getDate() + 1);
  }
  return { entries: monthlyEntries, ...totals, overdue, balance, expected: balance + totals.receivable - totals.payable, projection };
}

export function summarizeCash(entries: CashEntry[], start: string, end: string, today = cashToday()) {
  let opening = 0, income = 0, expense = 0, receivable = 0, payable = 0, current = 0, overdue = 0;
  for (const entry of entries) {
    if (entry.status === "cancelled") continue;
    if (entry.status === "paid" && entry.paid_date) {
      if (entry.paid_date <= today) current += signedAmount(entry);
      if (entry.paid_date < start) opening += signedAmount(entry);
      if (entry.paid_date >= start && entry.paid_date <= end) {
        if (entry.type === "income") income += entry.amount_cents;
        else expense += entry.amount_cents;
      }
    } else if (entry.status === "pending") {
      if (entry.due_date < today) overdue++;
      if (entry.due_date >= start && entry.due_date <= end) {
        if (entry.type === "income") receivable += entry.amount_cents;
        else payable += entry.amount_cents;
      }
    }
  }
  return { opening, income, expense, receivable, payable, current, overdue, closing: opening + income - expense };
}

export function projectCash(entries: CashEntry[], days: number, today = cashToday()) {
  let balance = summarizeCash(entries, today, today, today).current;
  const changes = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status !== "pending") continue;
    // Valores vencidos entram no primeiro dia da projeção e continuam pendentes.
    const date = entry.due_date < today ? today : entry.due_date;
    changes.set(date, (changes.get(date) ?? 0) + signedAmount(entry));
  }
  // A base continua sendo o saldo realizado; o ponto de hoje inclui os pendentes
  // de hoje e os vencidos uma única vez, como saldo projetado ao fim do dia.
  balance += changes.get(today) ?? 0;
  const points: { date: string; balance: number }[] = [{ date: today, balance }];
  for (let offset = 1; offset <= days; offset++) {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() + offset);
    const key = isoDate(date);
    balance += changes.get(key) ?? 0;
    points.push({ date: key, balance });
  }
  return points;
}

export function cashCsv(entries: CashEntry[]) {
  const cell = (value: string) => {
    const safe = /^(?:\s*[=+@-]|[\t\r\n])/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = entries.map(entry => [entry.description, entry.type === "income" ? "Entrada" : "Saída", (entry.amount_cents / 100).toFixed(2).replace(".", ","), entry.category, entry.account, displayDate(entry.due_date), entry.paid_date ? displayDate(entry.paid_date) : "", { pending: "Pendente", paid: "Realizado", cancelled: "Cancelado" }[entry.status], entry.notes].map(cell).join(";"));
  return "\uFEFF" + ["Descrição;Tipo;Valor (R$);Categoria;Conta;Vencimento;Pagamento;Status;Observações", ...rows].join("\r\n");
}
