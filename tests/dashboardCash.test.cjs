const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(__dirname, "../src/lib", `${name}.ts`), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(dependency => load(dependency.replace("./", "")), mod, mod.exports);
  cache.set(name, mod.exports);
  return mod.exports;
}
const { dashboardCash } = load("dashboardCash");
const { dashboardOrders } = load("dashboardOrders");
const { cashMonthData } = load("cashFlow");
const today = "2026-11-15";

test("order history groups registration dates by month in São Paulo", () => {
  const orders = [
    { data_pedido: "2026-10-01T02:59:59Z" },
    { data_pedido: "2026-11-01T02:59:59Z" },
    { data_pedido: "2026-11-01T03:00:00Z" },
    { data_pedido: "2026-11-01", created_at: "2026-10-01T12:00:00Z" },
    { data_pedido: "02/11/2026" },
    { data_pedido: " ", created_at: "2026-11-16T02:00:00Z" },
    { created_at: "2026-11-16T03:00:00Z" },
    { data_pedido: "2026-11-00" },
  ];
  const points = dashboardOrders(orders, 6, today);
  assert.deepEqual(points.map(point => point.value), [0, 0, 0, 1, 1, 4]);
  assert.deepEqual(dashboardOrders(orders, 3, today), points.slice(-3));
  assert.equal(dashboardOrders(orders, 12, today).length, 12);
});
const entry = (overrides = {}) => ({ id: "1", user_id: "owner", order_id: null, type: "income", amount_cents: 10000, description: "Venda", category: "Vendas", account: "Caixa", due_date: today, paid_date: null, status: "pending", notes: "", created_at: "", ...overrides });

test("dashboard reconciles with cash flow including manual entries, expenses, prior balances and pending amounts", () => {
  const entries = [
    entry({ status: "paid", paid_date: "2026-10-30", amount_cents: 90000 }),
    entry({ status: "paid", paid_date: today, order_id: 42, amount_cents: 25000 }),
    entry({ status: "paid", paid_date: "2026-11-02", amount_cents: 12000 }),
    entry({ type: "expense", status: "paid", paid_date: today, amount_cents: 8000 }),
    entry({ due_date: "2026-11-30", amount_cents: 5000 }),
    entry({ type: "expense", due_date: "2026-11-01", amount_cents: 3000 }),
    entry({ status: "cancelled", amount_cents: 999999 }),
    entry({ due_date: "2026-12-01", amount_cents: 100000 }),
  ];
  const { summary, months } = dashboardCash(entries, 3, today);
  assert.deepEqual(summary, cashMonthData(entries, "2026-11-01", "2026-11-30", today));
  assert.equal(summary.current, 119000);
  assert.equal(summary.balance, 29000);
  assert.equal(summary.expected, 31000);
  assert.deepEqual(months.map(({ income, expense, balance }) => [income, expense, balance]), [[0, 0, 0], [90000, 0, 90000], [37000, 8000, 29000]]);
});

test("settlement, edits, cancellation and deletion change the corresponding indicators and charts", () => {
  const pending = entry({ due_date: "2026-11-01", order_id: 42 });
  assert.equal(dashboardCash([pending], 3, today).summary.receivable, 10000);
  const paid = { ...pending, status: "paid", paid_date: today, amount_cents: 25000 };
  const settled = dashboardCash([paid], 3, today);
  assert.equal(settled.summary.receivable, 0);
  assert.equal(settled.summary.income, 25000);
  assert.equal(settled.months[2].income, 25000);
  for (const records of [[{ ...paid, status: "cancelled" }], []]) {
    const result = dashboardCash(records, 3, today);
    assert.equal(result.summary.current, 0);
    assert.equal(result.summary.income, 0);
    assert.equal(result.months[2].income, 0);
  }
});

test("future settlements never inflate current realized values and dates use settlement rather than due date", () => {
  const entries = [
    entry({ status: "paid", paid_date: "2026-11-16", amount_cents: 999999 }),
    entry({ status: "paid", due_date: "2026-10-10", paid_date: today, amount_cents: 12345 }),
    entry({ status: "paid", paid_date: null }),
  ];
  const result = dashboardCash(entries, 3, today);
  assert.equal(result.summary.current, 12345);
  assert.equal(result.summary.income, 12345);
  assert.deepEqual(result.months.map(month => month.income), [0, 0, 12345]);
});

test("empty and historical-only periods remain zero and rolling windows cross the year", () => {
  const result = dashboardCash([entry({ status: "paid", paid_date: "2020-01-01" })], 3, "2027-01-02");
  assert.deepEqual(result.months.map(month => month.label), ["11/26", "12/26", "01/27"]);
  assert.deepEqual(result.months.map(month => month.income), [0, 0, 0]);
  assert.equal(result.summary.income, 0);
  assert.equal(result.summary.current, 10000);
  const empty = dashboardCash([], 12, today);
  assert.equal(empty.months.length, 12);
  assert.equal(empty.summary.current, 0);
  assert.ok(empty.months.every(month => month.income === 0 && month.expense === 0 && month.balance === 0));
});

function dashboardScreen() {
  let index = 0;
  const hooks = [];
  const effects = [];
  const timers = new Map();
  const requests = [];
  let records = [];
  let products = [];
  let failure = null;
  const react = {
    useState(initial) {
      const key = index++;
      if (!(key in hooks)) hooks[key] = typeof initial === "function" ? initial() : initial;
      return [hooks[key], value => { hooks[key] = typeof value === "function" ? value(hooks[key]) : value; }];
    },
    useCallback: callback => callback,
  };
  const jsx = (type, props) => ({ type, props });
  const supabase = { from(table) {
    requests.push(table);
    let data = table === "produtos" ? [...products] : [];
    const query = {
      select: () => query,
      is: () => query,
      gt: (field, value) => { data = data.filter(row => row[field] > value); return query; },
      order: (field, options) => {
        if (options?.ascending === false) data.sort((a, b) => b[field] - a[field] || a.id - b.id);
        return query;
      },
      limit: count => { data = data.slice(0, count); return query; },
      then: resolve => Promise.resolve({ data, count: 0, error: null }).then(resolve),
    };
    return query;
  } };
  const mocks = name => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "expo-router") return { useFocusEffect: effect => effects.push(effect) };
    if (name === "react-native") return { StyleSheet: { create: value => value }, Text: "Text", View: "View", ActivityIndicator: "Spinner" };
    if (name === "@expo/vector-icons") return { Ionicons: "Icon" };
    if (name.endsWith("/cashFlow")) return load("cashFlow");
    if (name.endsWith("/dashboardCash")) return load("dashboardCash");
    if (name.endsWith("/dashboardOrders")) return load("dashboardOrders");
    if (name.endsWith("/cashFlowRepository")) return { cashError: error => error.message, loadCashEntries: async () => { requests.push("cash_flow_entries"); if (failure) throw failure; return records; } };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/useResponsive")) return () => ({ width: 1200, isMobile: false, graphWidth: 1000, maxCardWidth: 1100 });
    if (name.endsWith("/colors")) return { Colors: {} };
    if (name.endsWith("/ScreensLayout")) return { PagesLayout: "PagesLayout", pagesStyles: {} };
    if (name.endsWith("/orderItems")) return { orderItems: () => [], orderQuantity: () => 0 };
    return Object.fromEntries(["AnimatedButton", "LineGraph", "BarGraph", "PieGraph"].map(key => [key, key]));
  };
  const source = fs.readFileSync(path.join(__dirname, "../app/(tabs)/(home)/homeScreen.tsx"), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", "setInterval", "clearInterval", code)(mocks, mod, mod.exports,
    (callback, delay) => { assert.equal(delay, 30000); const id = timers.size + 1; timers.set(id, callback); return id; },
    id => timers.delete(id));
  return {
    render() { index = 0; return mod.exports.default(); },
    focus: () => effects.at(-1)(),
    refresh: () => timers.values().next().value(),
    data: value => { records = value; },
    products: value => { products = value; },
    fail: error => { failure = error; },
    timers, requests,
  };
}

const flush = () => new Promise(resolve => setImmediate(resolve));
test("dashboard shows the three largest positive production balances", async () => {
  const screen = dashboardScreen();
  screen.products([28, 0, 13, 41, 5].map((quantidade_a_produzir, index) => ({
    id: index + 1, nome: `Produto ${index + 1}`, quantidade_a_produzir,
  })));
  screen.render();
  const blur = screen.focus();
  await flush();
  function findPanel(node) {
    if (Array.isArray(node)) return node.map(findPanel).find(Boolean);
    if (node?.props?.testID === "dashboard-production-ranking") return node;
    if (node?.props) return findPanel(node.props.children);
  }
  const panel = findPanel(screen.render());
  assert.deepEqual(panel?.props.children[1].props.data, [
    { label: "Produto 4", value: 41 },
    { label: "Produto 1", value: 28 },
    { label: "Produto 3", value: 13 },
  ]);
  blur();
});
test("screen reads cash movements without orders, refreshes while focused, and stops polling on blur", async () => {
  const screen = dashboardScreen();
  const paid = entry({ status: "paid", paid_date: load("cashFlow").cashToday(), amount_cents: 12345 });
  screen.data([paid]);
  screen.render();
  const blur = screen.focus();
  await flush();
  const before = JSON.stringify(screen.render());
  assert.ok(before.includes(load("cashFlow").money(12345)));
  assert.ok(screen.requests.includes("cash_flow_entries"));
  screen.data([{ ...paid, amount_cents: 67890 }]);
  screen.refresh();
  await flush();
  assert.ok(JSON.stringify(screen.render()).includes(load("cashFlow").money(67890)));
  blur();
  assert.equal(screen.timers.size, 0);
});

test("screen exposes query failures instead of presenting financial zeroes as loaded data", async () => {
  const screen = dashboardScreen();
  screen.fail(new Error("offline"));
  screen.render();
  const blur = screen.focus();
  await flush();
  const tree = JSON.stringify(screen.render());
  assert.ok(tree.includes("offline"));
  assert.ok(!tree.includes("Entradas realizadas"));
  blur();
});
