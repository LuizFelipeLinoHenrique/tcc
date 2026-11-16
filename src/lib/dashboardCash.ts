import { CashEntry, cashMonthData, cashToday, isoDate } from "./cashFlow";

/** Mesma apuração do fluxo de caixa, com realizados limitados à data atual. */
export function dashboardCash(entries: CashEntry[], monthsCount: number, today = cashToday()) {
  const [year, month] = today.split("-").map(Number);
  const currentEntries = entries.filter(entry => entry.status !== "paid" || (!!entry.paid_date && entry.paid_date <= today));
  const start = `${today.slice(0, 7)}-01`;
  const end = isoDate(new Date(year, month, 0, 12));
  const summary = cashMonthData(currentEntries, start, end, today);
  const months = Array.from({ length: monthsCount }, (_, index) => {
    const date = new Date(year, month - monthsCount + index, 1, 12);
    const from = isoDate(date);
    const to = isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
    const totals = cashMonthData(currentEntries, from, to, today);
    return {
      label: date.toLocaleDateString("pt-BR", { month: "2-digit", year: "2-digit" }),
      income: totals.income,
      expense: totals.expense,
      balance: totals.balance,
    };
  });
  return { summary, months };
}
