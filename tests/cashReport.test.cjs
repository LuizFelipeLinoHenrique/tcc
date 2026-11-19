const assert = require("node:assert/strict");
const { Buffer } = require("node:buffer");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Excel = require("exceljs");

function loadSource(name, mocks = {}, cache = new Map()) {
  const filename = path.resolve(__dirname, "../src/lib", name + ".ts");
  if (cache.has(filename)) return cache.get(filename);
  const mod = { exports: {} };
  cache.set(filename, mod.exports);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", output)(dependency => {
    if (dependency in mocks) return mocks[dependency];
    return dependency.startsWith(".") ? loadSource(dependency, mocks, cache) : require(dependency);
  }, mod, mod.exports);
  return mod.exports;
}
const { monthlyCashReport, cashReportHtml } = loadSource("cashReport");
const { cashReportXlsx } = loadSource("cashReportXlsx");
const month = new Date(2026, 10, 1, 12);
const entry = overrides => ({ id: "pending", user_id: "user", type: "income", description: "Venda", category: "Vendas", account: "Caixa", amount_cents: 12345, due_date: "2026-11-05", paid_date: null, status: "pending", notes: "", created_at: "2026-11-01T12:00:00Z", ...overrides });
const records = [
  entry({ id: "opening", status: "paid", paid_date: "2026-10-31", amount_cents: 10000 }),
  entry({ id: "paid", status: "paid", due_date: "2026-10-30", paid_date: "2026-11-02", amount_cents: 20000, order_id: 42 }),
  entry({ id: "expense", type: "expense", status: "paid", paid_date: "2026-11-03", amount_cents: 3000 }),
  entry({ id: "pending", description: "=SUM(1,2)", notes: '<script>alert("teste")</script> & ação' }),
  entry({ id: "payable", type: "expense", due_date: "2026-11-30", amount_cents: 2345 }),
  entry({ id: "cancelled", status: "cancelled", amount_cents: 999999 }),
  entry({ id: "next-month", status: "paid", paid_date: "2026-12-01" }),
];

test("monthly report reconciles opening balances, settlement dates, pending and cancelled records", () => {
  const report = monthlyCashReport(records, month, "2026-11-19");
  const summary = Object.fromEntries(report.tables[0].rows);
  assert.equal(summary["Saldo anterior"], 100);
  assert.equal(summary["Entradas realizadas"], 200);
  assert.equal(summary["Saídas realizadas"], 30);
  assert.equal(summary["Saldo acumulado realizado"], 270);
  assert.equal(summary["Saldo previsto no mês"], 270);
  assert.equal(summary["Saldo acumulado previsto"], 370);
  const counts = Object.fromEntries(report.tables.find(table => table.title === "Lançamentos por situação").rows);
  assert.equal(counts["Total de lançamentos"], 5);
  assert.equal(counts["Realizados"], 2);
  assert.equal(counts["Vencidos na data de referência"], 1);
  assert.equal(counts["Cancelados"], 1);
  const categories = report.tables.find(table => table.title === "Categorias").rows;
  assert.deepEqual(categories[0], ["Vendas", 200, 30, 123.45, 23.45, 123.45, 0, 9999.99]);
  const daily = report.tables.find(table => table.title === "Evolução diária").rows;
  assert.equal(daily.length, 30);
  assert.equal(daily.at(-1)[5], 270);
  assert.equal(daily.at(-1)[6], 370);
});

test("empty and leap months still include the complete daily period and prior balance", () => {
  const report = monthlyCashReport([], new Date(2024, 1, 12), "2026-11-19");
  assert.equal(report.end, "2024-02-29");
  assert.equal(report.tables.find(table => table.title === "Evolução diária").rows.length, 29);
  assert.equal(report.tables.find(table => table.title === "Categorias").rows.length, 0);
  assert.equal(report.tables[1].rows[0][1], 0);
  const december = monthlyCashReport(records.slice(0, 3), new Date(2026, 11, 1), "2026-11-19");
  assert.equal(december.tables[0].rows[0][1], 270);
});

test("XLSX contains only metric sheets, numeric amounts and safe category labels", async () => {
  const report = monthlyCashReport(records.map(record => record.id === "pending" ? { ...record, category: "=SUM(1,2)" } : record), month, "2026-11-19");
  const bytes = await cashReportXlsx(report);
  assert.equal(Buffer.from(bytes).subarray(0, 2).toString(), "PK");
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(bytes);
  assert.equal(workbook.worksheets.length, 4);
  assert.equal(workbook.getWorksheet("Resumo financeiro").getCell("B2").value, 100);
  assert.equal(workbook.getWorksheet("Lançamentos"), undefined);
  assert.equal(workbook.getWorksheet("Sobre o relatório"), undefined);
  const categories = workbook.getWorksheet("Categorias");
  assert.equal(categories.getCell("A2").value, "=SUM(1,2)");
  assert.equal(categories.getCell("D2").type, Excel.ValueType.Number);
  assert.equal(categories.getCell("D2").value, 123.45);
  assert.match(categories.getCell("D2").numFmt, /R\$/);
  assert.equal(categories.views[0].ySplit, 1);
  for (const sheet of workbook.worksheets) {
    sheet.eachRow(row => row.eachCell(cell => assert.ok(!String(cell.value).includes("<script>"))));
  }
});

test("native PDF HTML includes metrics and escapes category labels without transaction details or prose", () => {
  const html = cashReportHtml(monthlyCashReport(records.map(record => ({ ...record, category: "A & B <teste>" })), month, "2026-11-19"));
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes("A &amp; B &lt;teste&gt;"));
  for (const value of ["Pedido: 42", "ID: paid", "Criado em:", "Descrição", "Observações", "Cancelados não compõem saldos"]) assert.ok(!html.includes(value), value);
  for (const value of ["Resumo financeiro", "Evolução diária", "270,00", "370,00"]) assert.ok(html.includes(value), value);
});

test("web PDF downloads a real paginated document with monthly metrics and no descriptions", async () => {
  const { exportCashReport } = loadSource("exportCashReport.web");
  const previousDocument = global.document;
  const previousCreate = URL.createObjectURL;
  const previousRevoke = URL.revokeObjectURL;
  const previousTimeout = global.setTimeout;
  let blob, downloaded, clicked = false;
  URL.createObjectURL = value => { blob = value; return "blob:report"; };
  URL.revokeObjectURL = () => {};
  global.setTimeout = callback => { callback(); };
  global.document = { createElement: () => ({ click() { clicked = true; downloaded = this.download; }, remove() {} }), body: { appendChild() {} } };
  try {
    const many = [...records, ...Array.from({ length: 80 }, (_, i) => entry({ id: `record-${i}`, description: `Transaction-${i}`, category: `Category-${i}`, notes: "Long notes ".repeat(20) }))];
    await exportCashReport(monthlyCashReport(many, month, "2026-11-19"), "pdf");
    assert.equal(clicked, true);
    assert.equal(downloaded, "fluxo-de-caixa-2026-11.pdf");
    assert.equal(blob.type, "application/pdf");
    const content = Buffer.from(await blob.arrayBuffer()).toString("latin1");
    assert.ok(content.startsWith("%PDF-"));
    assert.ok((content.match(/\/Type \/Page\b/g) || []).length >= 4);
    assert.ok(content.includes("Category-79"));
    assert.ok(!content.includes("Transaction-79"));
    assert.ok(!content.includes("record-79"));
    assert.ok(!content.includes("Long notes"));
    assert.ok(!content.includes("next-month"));
  } finally {
    global.document = previousDocument; URL.createObjectURL = previousCreate;
    URL.revokeObjectURL = previousRevoke; global.setTimeout = previousTimeout;
  }
});

test("native exports share real files with matching extensions and clean temporary files", async () => {
  const saved = new Map();
  class File {
    constructor(...parts) { this.uri = parts.join("/"); }
    get exists() { return saved.has(this.uri); }
    write(bytes) { saved.set(this.uri, bytes); }
    bytes() { return saved.get(this.uri); }
    delete() { saved.delete(this.uri); }
  }
  const shared = [];
  const { exportCashReport } = loadSource("exportCashReport", {
    "expo-file-system": { File, Paths: { cache: "cache" } },
    "expo-print": { printToFileAsync: async ({ html }) => { assert.ok(html.startsWith("<!DOCTYPE html>")); saved.set("tmp.pdf", Buffer.from("%PDF-mocked-native-printer")); return { uri: "tmp.pdf" }; } },
    "expo-sharing": { isAvailableAsync: async () => true, shareAsync: async (uri, options) => { assert.ok(saved.get(uri).length > 0); shared.push({ uri, options }); } },
  });
  const report = monthlyCashReport(records, month, "2026-11-19");
  await exportCashReport(report, "pdf");
  await exportCashReport(report, "xlsx");
  assert.equal(shared[0].uri, "cache/fluxo-de-caixa-2026-11.pdf");
  assert.equal(shared[1].uri, "cache/fluxo-de-caixa-2026-11.xlsx");
  assert.equal(shared[0].options.mimeType, "application/pdf");
  assert.equal(saved.size, 0);
});
