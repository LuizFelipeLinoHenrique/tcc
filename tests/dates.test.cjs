const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/dates.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function("module", "exports", code)(mod, mod.exports);
const { displayDate, maskDate } = mod.exports;

test("dates use DD/MM/YYYY without shifting calendar days and timestamps use São Paulo", () => {
  assert.equal(displayDate("2026-01-05"), "05/01/2026");
  assert.equal(displayDate("05/01/2026"), "05/01/2026");
  assert.equal(displayDate("2026-11-15T02:00:00Z"), "14/11/2026");
  assert.equal(displayDate(new Date("2026-11-15T15:00:00Z")), "15/11/2026");
  assert.equal(displayDate("2024-02-29"), "29/02/2024");
  for (const value of [null, undefined, "", " ", "invalid", "2026-02-29", "31/04/2026", new Date(NaN)]) {
    assert.equal(displayDate(value), "Não informada");
  }
});

test("date masks handle partial input, formatted pastes, excess digits and deletion", () => {
  for (const [value, expected] of [["", ""], ["1", "1"], ["15", "15"], ["151", "15/1"], ["1511", "15/11"], ["15112", "15/11/2"], ["15112026", "15/11/2026"], ["15/11/2026", "15/11/2026"], ["1511202699", "15/11/2026"], ["abc15/11/2026", "15/11/2026"], ["15/11/202", "15/11/202"]]) {
    assert.equal(maskDate(value), expected);
  }
});
