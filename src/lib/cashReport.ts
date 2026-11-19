import { CashEntry, cashMonthData, cashToday, displayDate, effectiveDate, isoDate, money } from "./cashFlow";

export type ReportTable = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  currencyColumns: number[];
};

export function monthlyCashReport(entries: CashEntry[], month: Date, today = cashToday()) {
  const start = isoDate(new Date(month.getFullYear(), month.getMonth(), 1, 12));
  const end = isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0, 12));
  const summary = cashMonthData(entries, start, end, today);
  const records = summary.entries;
  const metrics = [
    ["Saldo anterior", summary.opening], ["Entradas realizadas", summary.income],
    ["Saídas realizadas", summary.expense], ["Saldo realizado no mês", summary.balance],
    ["Saldo acumulado realizado", summary.closing], ["A receber no mês", summary.receivable],
    ["A pagar no mês", summary.payable], ["Saldo previsto no mês", summary.expected],
    ["Saldo acumulado previsto", summary.opening + summary.expected],
  ] as [string, number][];
  const categories = new Map<string, number[]>();
  const days = new Map<string, number[]>();
  for (const entry of records) {
    const group = categories.get(entry.category) ?? [0, 0, 0, 0, 0, 0, 0];
    categories.set(entry.category, group);
    const day = days.get(effectiveDate(entry)) ?? [0, 0, 0, 0];
    days.set(effectiveDate(entry), day);
    if (entry.status === "cancelled") { group[6] += entry.amount_cents; continue; }
    const index = (entry.status === "paid" ? 0 : 2) + (entry.type === "expense" ? 1 : 0);
    group[index] += entry.amount_cents;
    day[index] += entry.amount_cents;
    if (entry.status === "pending" && entry.due_date < today) group[entry.type === "income" ? 4 : 5] += entry.amount_cents;
  }
  let realized = summary.opening;
  const daily = summary.projection.map(point => {
    const values = days.get(point.date) ?? [0, 0, 0, 0];
    realized += values[0] - values[1];
    return [displayDate(point.date), ...values.map(value => value / 100), realized / 100, (summary.opening + point.balance) / 100];
  });
  const tables: ReportTable[] = [
    { title: "Resumo financeiro", headers: ["Indicador", "Valor (R$)"], rows: metrics.map(([label, value]) => [label, value / 100]), currencyColumns: [1] },
    { title: "Lançamentos por situação", headers: ["Situação", "Quantidade"], currencyColumns: [], rows: [
      ["Total de lançamentos", records.length], ["Realizados", records.filter(entry => entry.status === "paid").length],
      ["Pendentes (inclui vencidos)", records.filter(entry => entry.status === "pending").length],
      ["Vencidos na data de referência", summary.overdue], ["Cancelados", records.filter(entry => entry.status === "cancelled").length],
    ] },
    { title: "Categorias", headers: ["Categoria", "Entradas realizadas", "Saídas realizadas", "A receber", "A pagar", "A receber vencido", "A pagar vencido", "Cancelados"], currencyColumns: [1, 2, 3, 4, 5, 6, 7], rows: [...categories].sort(([a], [b]) => a.localeCompare(b, "pt-BR")).map(([name, values]) => [name, ...values.map(value => value / 100)]) },
    { title: "Evolução diária", headers: ["Data", "Entradas realizadas", "Saídas realizadas", "A receber", "A pagar", "Saldo realizado acumulado", "Saldo previsto acumulado"], rows: daily, currencyColumns: [1, 2, 3, 4, 5, 6] },
  ];
  return {
    title: "PalletCore • Relatório mensal de fluxo de caixa",
    period: month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    start, end, today, filename: `fluxo-de-caixa-${start.slice(0, 7)}`,
    tables,
  };
}

export type MonthlyCashReport = ReturnType<typeof monthlyCashReport>;
export const reportCell = (table: ReportTable, value: string | number, column: number) => table.currencyColumns.includes(column) && typeof value === "number" ? money(Math.round(value * 100)) : String(value);

export function cashReportHtml(report: MonthlyCashReport) {
  const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escape(report.title)}</title><style>
    @page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#0f172a;font-size:9px}h1{font-size:20px;color:#0b4f6c}h2{font-size:14px;page-break-after:avoid}p{line-height:1.5}table{border-collapse:collapse;width:100%;margin-bottom:22px;table-layout:fixed}th,td{border:1px solid #dce7ee;padding:5px;text-align:left;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#0b4f6c;color:white}thead{display:table-header-group}tr{page-break-inside:avoid}tbody tr:nth-child(even){background:#f1f5f9}
  </style></head><body><h1>${escape(report.title)}</h1><h2>${escape(report.period)}</h2><p>Referência: ${displayDate(report.today)}</p>${report.tables.map(table => `<h2>${escape(table.title)}</h2><table><thead><tr>${table.headers.map(header => `<th>${escape(header)}</th>`).join("")}</tr></thead><tbody>${table.rows.length ? table.rows.map(row => `<tr>${row.map((value, index) => `<td>${escape(reportCell(table, value, index))}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${table.headers.length}">—</td></tr>`}</tbody></table>`).join("")}</body></html>`;
}
