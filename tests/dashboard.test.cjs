const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function loadDashboard(pages = []) {
  const cursors = [];
  const mod = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, "../src/lib/dashboard.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const requireMock = () => ({
    supabase: {
      from() {
        const next = pages.shift();
        assert.ok(next, "unexpected database query");
        const query = {
          select: () => query,
          order: () => query,
          limit: () => query,
          gt(_column, cursor) { cursors.push(cursor); return query; },
          overrideTypes: () => Promise.resolve(next),
        };
        return query;
      },
    },
  });
  new Function("require", "exports", outputText)(requireMock, mod.exports);
  return { ...mod.exports, cursors };
}

test("dashboard uses every page even if the API returns fewer results than requested", async () => {
  const { loadDashboardRows, cursors } = loadDashboard([
    { data: [{ id: 5 }, { id: 6 }] },
    { data: [{ id: 11 }] },
    { data: [] },
  ]);
  assert.deepEqual(await loadDashboardRows("pedidos", "id"), [{ id: 5 }, { id: 6 }, { id: 11 }]);
  assert.deepEqual(cursors, [6, 11]);
});

test("an error on a dashboard page rejects incomplete metrics", async () => {
  const error = new Error("Offline");
  const { loadDashboardRows } = loadDashboard([{ data: [{ id: 1 }] }, { error }]);
  await assert.rejects(loadDashboardRows("pedidos", "id"), error);
});

test("order dates at the start of a month remain in the correct month", () => {
  const { buildTimelineData } = loadDashboard();
  const orders = [{ id: 1, data_pedido: "2026-11-01" }, { id: 2, data_pedido: "2026-09-30" }];
  const points = buildTimelineData(orders, 2, order => order.id * 25, new Date(2026, 10, 15));
  assert.deepEqual(points.map(point => point.value), [0, 25]);
});

test("old or undated orders do not inflate the current period", () => {
  const { buildTimelineData } = loadDashboard();
  const points = buildTimelineData([
    { id: 1, data_pedido: "2025-11-01" },
    { id: 2, data_pedido: null },
  ], 3, () => 500, new Date(2026, 10, 15));
  assert.deepEqual(points.map(point => point.value), [0, 0, 0]);
});
