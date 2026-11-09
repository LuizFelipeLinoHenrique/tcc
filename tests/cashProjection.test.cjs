const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/lib/cashChart.ts"), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
const mod = { exports: {} };
new Function("module", "exports", outputText)(mod, mod.exports);
const { buildCashChart, traceCashLine } = mod.exports;
const points = values => values.map((balance, i) => ({ date: `2026-11-${10 + i}`, balance }));

function contained(chart) {
  for (const point of chart.coordinates) {
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    // Margem inclui tanto a espessura da linha quanto os círculos das extremidades.
    assert.ok(point.x - 3 >= chart.bounds.left && point.x + 3 <= chart.bounds.right);
    assert.ok(point.y - 3 >= chart.bounds.top && point.y + 3 <= chart.bounds.bottom);
  }
  assert.ok(!/NaN|Infinity/.test(chart.path));
}

test("line and endpoint markers stay inside the plot for abrupt changes and extreme balances", () => {
  for (const values of [[-100000, -900000], [100000, 900000], [100000, -900000, 900000], [0, 0], [1], [1, -1], [999999999999, -999999999999], [-999999999999, 1]]) {
    for (const width of [180, 240, 375, 600, 1000]) contained(buildCashChart(points(values), width));
  }
});

test("straight segments cannot introduce artificial peaks between daily balances", () => {
  const chart = buildCashChart(points([100000, -150000, -150000, 200000]), 600);
  assert.ok(chart.path.startsWith("M "));
  assert.equal((chart.path.match(/L /g) || []).length, 3);
  assert.ok(!/[CQST]/.test(chart.path));
  assert.equal(chart.coordinates[1].y, chart.coordinates[2].y);
  assert.ok(chart.coordinates[1].y > chart.coordinates[0].y);
});

test("all 30/60/90-day daily balances fit the same fixed height", () => {
  for (const days of [30, 60, 90]) {
    const values = Array.from({ length: days + 2 }, (_, i) => i % 2 === 0 ? 123456 : -987654);
    const chart = buildCashChart(points(values), 320);
    assert.equal(chart.coordinates.length, days + 2);
    assert.equal(chart.height, 176);
    assert.equal(chart.bounds.bottom - chart.bounds.top, 132);
    contained(chart);
  }
});

test("zero baseline stays inside a shared scale for positive, negative and empty ledgers", () => {
  for (const values of [[100, 200], [-100, -200], [0, 0], []]) {
    const chart = buildCashChart(points(values), 320);
    assert.ok(chart.zeroY > chart.bounds.top && chart.zeroY < chart.bounds.bottom);
    assert.equal(chart.ticks.length, 5);
    assert.ok(chart.ticks.every(tick => Number.isFinite(tick.value) && Number.isFinite(tick.y)));
  }
});

test("single-point projections are centered with a finite path", () => {
  const chart = buildCashChart(points([0]), 320);
  assert.equal(chart.coordinates[0].x, (chart.bounds.left + chart.bounds.right) / 2);
  contained(chart);
});

test("randomized daily balances remain bounded without dropping or changing input data", () => {
  let seed = 42;
  for (let sample = 0; sample < 100; sample++) {
    const values = Array.from({ length: 92 }, () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed - 2147483648; });
    const input = points(values);
    const chart = buildCashChart(input, 180 + sample * 10);
    contained(chart);
    assert.deepEqual(chart.coordinates.map(point => point.balance), values);
    assert.deepEqual(input, points(values));
  }
});

test("animation advances the tip along actual segments and finishes at the final balance", () => {
  const chart = buildCashChart(points([100000, -900000, 200000, 0]), 600);
  let previousLength = 0;
  for (let step = 0; step <= 100; step++) {
    const frame = traceCashLine(chart.coordinates, step / 100);
    assert.ok(frame.tip.x >= previousLength);
    previousLength = frame.tip.x;
    assert.ok(frame.tip.x >= chart.bounds.left + 3 && frame.tip.x <= chart.bounds.right - 3);
    assert.ok(frame.tip.y >= chart.bounds.top + 3 && frame.tip.y <= chart.bounds.bottom - 3);
    assert.ok(frame.path.endsWith(`${frame.tip.x},${frame.tip.y}`));
  }
  const last = chart.coordinates.at(-1);
  const final = traceCashLine(chart.coordinates, 1).tip;
  assert.ok(Math.abs(final.x - last.x) < 0.00001 && Math.abs(final.y - last.y) < 0.00001);
});

test("animation handles empty and constant series and clamps progress", () => {
  assert.deepEqual(traceCashLine([], 0.5), { path: "", tip: null });
  const chart = buildCashChart(points([0, 0, 0]), 320);
  const position = ({ x, y }) => ({ x, y });
  assert.deepEqual(position(traceCashLine(chart.coordinates, -1).tip), position(chart.coordinates[0]));
  assert.deepEqual(position(traceCashLine(chart.coordinates, 2).tip), position(chart.coordinates.at(-1)));
  const single = buildCashChart(points([100]), 320);
  assert.deepEqual(traceCashLine(single.coordinates, 0.5).tip, single.coordinates[0]);
});
