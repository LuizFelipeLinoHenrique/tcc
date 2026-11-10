const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/lib/cashFlow.ts"), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const mod = { exports: {} };
new Function("module", "exports", outputText)(mod, mod.exports);
const { parseMoney, parseDate, addMonths, summarizeCash, projectCash, cashCsv, effectiveDate } = mod.exports;
const entry = (overrides = {}) => ({ id: "1", user_id: "user", description: "Venda", amount_cents: 10000, type: "income", category: "Vendas", account: "Caixa", due_date: "2026-11-10", paid_date: null, status: "pending", notes: "", created_at: "", ...overrides });

test("monetary input keeps cents exact and rejects invalid or ambiguous input", () => {
  assert.equal(parseMoney("R$ 1.234,56"), 123456);
  assert.equal(parseMoney("0,10"), 10);
  assert.equal(parseMoney("1,5"), 150);
  assert.equal(parseMoney("1.234"), 123400);
  for (const value of ["0", "-2", "1.23", "1,234", "NaN", "1e4", "", "10000000000"]) assert.equal(parseMoney(value), null, value);
});

test("dates reject impossible days and monthly recurrence preserves original day", () => {
  assert.equal(parseDate("29/02/2024"), "2024-02-29");
  for (const date of ["29/02/2026", "31/04/2026", "2026-01-01", "01/01/0000"]) assert.equal(parseDate(date), null);
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2026-01-31", 2), "2026-03-31");
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
});

test("actual balances use settlement dates and never count pending or cancelled values as cash", () => {
  const records = [
    entry({ status: "paid", paid_date: "2026-10-31", amount_cents: 50000 }),
    entry({ status: "paid", due_date: "2026-10-20", paid_date: "2026-11-02", amount_cents: 20000 }),
    entry({ status: "paid", type: "expense", paid_date: "2026-11-03", amount_cents: 3000 }),
    entry({ amount_cents: 15000 }),
    entry({ type: "expense", due_date: "2026-11-01", amount_cents: 5000 }),
    entry({ status: "cancelled", amount_cents: 999999 }),
  ];
  assert.deepEqual(summarizeCash(records, "2026-11-01", "2026-11-30", "2026-11-09"), { opening: 50000, income: 20000, expense: 3000, receivable: 15000, payable: 5000, current: 67000, overdue: 1, closing: 67000 });
  assert.equal(effectiveDate(records[1]), "2026-11-02");
});

test("projection includes overdue pending on first day, future entries on due dates, excludes cancellations", () => {
  const records = [entry({ status: "paid", paid_date: "2026-11-08", amount_cents: 10000 }), entry({ type: "expense", due_date: "2026-11-01", amount_cents: 2000 }), entry({ due_date: "2026-11-10", amount_cents: 5000 }), entry({ due_date: "2027-01-01", amount_cents: 99999 }), entry({ status: "cancelled", amount_cents: 99999 })];
  const points = projectCash(records, 2, "2026-11-09");
  assert.equal(points.length, 3);
  assert.equal(points[0].balance, 8000);
  assert.equal(points[1].balance, 13000);
  assert.equal(points[2].balance, 13000);
  assert.equal(points.at(-1).date, "2026-11-11");
  assert.equal(points.at(-1).balance, 13000);
  assert.equal(records[1].status, "pending");
});

test("empty ledger produces zero balances and stable projection", () => {
  assert.equal(summarizeCash([], "2026-11-01", "2026-11-30").current, 0);
  assert.ok(projectCash([], 30, "2026-11-09").every(point => point.balance === 0));
});

test("CSV quotes delimiters, escapes quotes, protects spreadsheet formulas, and formats BRL", () => {
  const csv = cashCsv([entry({ description: '=SUM(1;2)', notes: 'Uma "nota"; teste' })]);
  assert.ok(csv.startsWith("\uFEFFDescrição;"));
  assert.ok(csv.includes('"\'=SUM(1;2)"'));
  assert.ok(csv.includes('"100,00"'));
  assert.ok(csv.includes('"Uma ""nota""; teste"'));
  assert.ok(cashCsv([entry({ description: "  =1+2" })]).includes('"\'  =1+2"'));
});

 test("projection has one point per day and applies today and overdue entries once", () => {
  const records = [
    entry({ status: "paid", paid_date: "2026-11-09", amount_cents: 10000 }),
    entry({ due_date: "2026-11-09", amount_cents: 3000 }),
    entry({ due_date: "2026-11-08", type: "expense", amount_cents: 2000 }),
    entry({ due_date: "2026-11-10", amount_cents: 5000 }),
  ];
  for (const days of [0, 1, 30, 60, 90]) {
    const points = projectCash(records, days, "2026-11-09");
    assert.equal(points.length, days + 1);
    assert.equal(new Set(points.map(point => point.date)).size, days + 1);
    assert.equal(points[0].balance, 11000);
    assert.equal(points.at(-1).balance, days ? 16000 : 11000);
  }
  assert.equal(summarizeCash(records, "2026-11-09", "2026-11-09", "2026-11-09").current, 10000);
});
