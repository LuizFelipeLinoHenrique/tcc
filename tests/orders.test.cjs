const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function compile(file, requireMock) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(requireMock, mod, mod.exports);
  return mod.exports;
}

// Exercise screen callbacks with persistent hook state and controlled query responses.
function screen(file, props = {}) {
  let index = 0;
  const hooks = [];
  const requests = [];
  const effects = [];
  const react = {
    useState(initial) {
      const key = index++;
      if (!(key in hooks)) hooks[key] = initial;
      return [hooks[key], value => { hooks[key] = typeof value === "function" ? value(hooks[key]) : value; }];
    },
    useRef(initial) {
      const key = index++;
      if (!(key in hooks)) hooks[key] = { current: initial };
      return hooks[key];
    },
    useCallback: callback => callback,
    useEffect: effect => effects.push(effect),
  };
  const jsx = (type, props) => ({ type, props });
  const supabase = { from(table) {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    const request = { table, resolve, reject, calls: [] };
    requests.push(request);
    const query = { then: promise.then.bind(promise) };
    for (const method of ["select", "eq", "is", "gt", "gte", "order", "limit", "maybeSingle", "single", "insert"]) {
      query[method] = (...args) => { request.calls.push([method, ...args]); return query; };
    }
    return query;
  } };
  supabase.rpc = (name, args) => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    requests.push({ table: name, calls: [["rpc", name, args]], resolve, reject });
    return promise;
  };
  const load = name => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "react-native") return { Alert: { alert() {} }, StyleSheet: { create: styles => styles }, ...Object.fromEntries(["View", "Text", "TextInput", "ActivityIndicator", "FlatList", "ScrollView", "Pressable"].map(key => [key, key])) };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/orderItems")) return compile("src/lib/orderItems.ts", load);
    if (name.endsWith("/orderValidation")) return compile("src/lib/orderValidation.ts", load);
    if (name.endsWith("/cashFlow")) return compile("src/lib/cashFlow.ts", load);
    if (name.endsWith("/pagination")) return compile("src/lib/pagination.ts", load);
    if (name.endsWith("/tableActions")) return compile("src/lib/tableActions.ts", load);
    if (name.endsWith("/colors")) return { Colors: {} };
    if (name.endsWith("/useResponsive")) return { __esModule: true, default: () => ({ isMobile: false }) };
    if (name.endsWith("/useRecordDeletion")) return { useRecordDeletion: () => ({}) };
    if (name.endsWith("/ScreensLayout")) return { PagesLayout: "PagesLayout", pagesStyles: {} };
    const key = name.split("/").at(-1);
    return { [key]: key, Ionicons: "Ionicons" };
  };
  const exports = compile(file, load);
  const Component = exports.default ?? exports.EditOrderCard ?? exports.OrderTableRow;
  let tree;
  function render() { index = 0; tree = Component(props); }
  function nodes(type, node = tree) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(child => nodes(type, child ?? null));
    return [...(node.type === type ? [node] : []), ...nodes(type, node.props?.children ?? null)];
  }
  render();
  return { render, nodes, requests, runEffects: () => effects.splice(0).forEach(effect => effect()) };
}

const addScreen = () => {
  const page = screen("app/(tabs)/(order)/addOrder.tsx");
  page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Vencimento do recebimento").props.onChangeText("20/11/2026");
  page.render();
  return page;
};

test("delete action appears only for cancelled orders", () => {
  for (const status of ["P", "E", "C"]) {
    let clicked = false;
    const page = screen("src/components/OrdersCard.tsx", {
      pedido: { id: 266, status, id_cliente: 1, id_produto: 1, qtde: 1 },
      iconDetails() {}, iconEdit() {}, iconDelete() { clicked = true; },
    });
    const deletes = page.nodes("Pressable").filter(node => node.props.accessibilityLabel === "Excluir");
    assert.equal(deletes.length, status === "C" ? 1 : 0);
    if (deletes.length) deletes[0].props.onPress();
    assert.equal(clicked, status === "C");
  }
});

test("paid orders cannot expose deletion even when cancelled; unknown finance is protected", () => {
  for (const [financeiro, expected] of [[{ status: "paid" }, 0], [{ status: "cancelled" }, 1], [null, 0]]) {
    const page = screen("src/components/OrdersCard.tsx", {
      pedido: { id: 279, status: "C", id_cliente: 1, id_produto: 1, qtde: 1, financial_user_id: "owner", financeiro },
      iconDetails() {}, iconEdit() {}, iconDelete() {},
    });
    const deletes = page.nodes("Pressable").filter(node => node.props.accessibilityLabel === "Excluir");
    assert.equal(deletes.length, expected);
    if (financeiro?.status === "paid") {
      assert.ok(page.nodes("View").some(node => node.props.accessibilityLabel === "Recebimento realizado: exclusão bloqueada"));
    }
  }
});

test("editing preserves all items and saves quantities and status in one operation", async () => {
  let saved = false;
  const page = screen("src/components/OrdersEdit.tsx", { idPedido: 42, onSaveSuccess: () => { saved = true; } });
  page.runEffects();
  page.requests[0].resolve({ data: { id: 42, id_cliente: 5, id_produto: 10, qtde: 2, status: "P", itens: [{ id_produto: 10, qtde: 2 }, { id_produto: 20, qtde: 7 }] } });
  await new Promise(resolve => setImmediate(resolve));
  page.render();
  page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Quantidade do produto 2").props.onChangeText("11");
  page.render();
  const saving = page.nodes("AnimatedButton").find(node => node.props.title === "Salvar Alterações").props.onPress();
  assert.deepEqual(page.requests.at(-1).calls[0], ["rpc", "save_order_items", { p_pedido: 42, p_cliente: 5, p_status: "P", p_itens: [{ id_produto: 10, qtde: 2 }, { id_produto: 20, qtde: 11 }] }]);
  page.requests.at(-1).resolve({ data: 42 });
  await saving;
  assert.equal(saved, true);
});

test("integrated order editing preserves customer and items while allowing delivery status", async () => {
  const page = screen("src/components/OrdersEdit.tsx", { idPedido: 42 });
  page.runEffects();
  page.requests[0].resolve({ data: { id: 42, id_cliente: 5, id_produto: 10, qtde: 2, status: "P", financial_user_id: "owner", itens: [{ id_produto: 10, qtde: 2 }] } });
  await new Promise(resolve => setImmediate(resolve));
  page.render();
  assert.equal(page.nodes("TextInput")[0].props.editable, false);
  assert.equal(page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Quantidade do produto 1").props.editable, false);
  assert.equal(page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar outro produto").props.disabled, true);
  assert.equal(page.nodes("TextInput")[1].props.editable, true);
});

async function addProduct(page, id, quantity) {
  page.nodes("TextInput")[1].props.onChangeText(String(id));
  page.nodes("TextInput")[2].props.onChangeText(String(quantity));
  page.render();
  const adding = page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar produto ao pedido").props.onPress();
  page.requests.at(-1).resolve({ data: { id, nome: `Produto ${id}` } });
  await adding;
  page.render();
}

test("multiple products submit one order with independent quantities and clear only after success", async () => {
  const page = addScreen();
  await addProduct(page, 10, 2);
  await addProduct(page, 20, 7);
  const quantity = page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Quantidade do produto 10");
  quantity.props.onChangeText("3");
  page.nodes("TextInput")[0].props.onChangeText("5");
  page.render();
  const saving = page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar Pedido").props.onPress();
  page.requests.at(-1).resolve({ data: { id: 5, nome: "Cliente" } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(page.requests.at(-1).calls[0], ["rpc", "save_order_items", {
    p_cliente: 5, p_status: "P", p_itens: [{ id_produto: 10, qtde: 3 }, { id_produto: 20, qtde: 7 }],
    p_due_date: "2026-11-20", p_request_id: page.requests.at(-1).calls[0][2].p_request_id,
  }]);
  assert.match(page.requests.at(-1).calls[0][2].p_request_id, /^[0-9a-f-]{36}$/);
  page.requests.at(-1).resolve({ data: 99 });
  await saving;
  page.render();
  assert.equal(page.nodes("TextInput").length, 4);
  assert.equal(page.nodes("TextInput")[0].props.value, "");
  assert.match(JSON.stringify(page.nodes("Text")), /Pedido #99 cadastrado/);
});

test("duplicate products are rejected and removal preserves other quantities", async () => {
  const page = addScreen();
  await addProduct(page, 10, 2);
  await addProduct(page, 10, 8);
  assert.match(JSON.stringify(page.nodes("Text")), /já está no pedido/);
  assert.equal(page.nodes("Pressable").length, 1);
  await addProduct(page, 20, 9);
  page.nodes("Pressable").find(node => node.props.accessibilityLabel === "Remover produto 10").props.onPress();
  page.render();
  assert.equal(page.nodes("Pressable").length, 1);
  assert.equal(page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Quantidade do produto 20").props.value, "9");
});

test("invalid cart quantities block submission and failed saves preserve all products", async () => {
  const page = addScreen();
  await addProduct(page, 10, 2);
  await addProduct(page, 20, 7);
  page.nodes("TextInput")[0].props.onChangeText("5");
  page.render();
  const validate = page.nodes("TextInput")[0].props.onBlur();
  page.requests.at(-1).resolve({ data: { id: 5, nome: "Cliente" } });
  await validate;
  page.render();
  page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Quantidade do produto 20").props.onChangeText("1.5");
  page.render();
  assert.equal(page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar Pedido").props.disabled, true);
  page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Quantidade do produto 20").props.onChangeText("7");
  page.render();
  const save = page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar Pedido").props.onPress();
  page.requests.at(-1).resolve({ data: { id: 5, nome: "Cliente" } });
  await new Promise(resolve => setImmediate(resolve));
  page.requests.at(-1).resolve({ error: { code: "42501" } });
  await save;
  page.render();
  assert.equal(page.nodes("Pressable").length, 2);
  assert.equal(page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Quantidade do produto 20").props.value, "7");
});

test("invalid order searches clear results without issuing a query", async () => {
  const page = screen("app/(tabs)/(order)/orders.tsx");
  for (const value of ["abc", "1.5", "Infinity", "0", "-1", "1e3", "9007199254740992"]) {
    page.nodes("OrdersFilters")[0].props.setPesquisa(value);
    page.render();
    page.nodes("OrdersFilters")[0].props.onSearch();
    page.render();
    assert.equal(page.requests.length, 0);
    assert.deepEqual(page.nodes("FlatList")[0].props.data, []);
    assert.match(page.nodes("Text").find(node => node.props.accessibilityRole === "alert").props.children, /identificador válido/);
  }
});

test("valid order searches apply the chosen identifier filter and expose retry on failure", async () => {
  const page = screen("app/(tabs)/(order)/orders.tsx");
  page.nodes("OrdersFilters")[0].props.setPesquisa("42");
  page.nodes("OrdersFilters")[0].props.setTipoPesquisa("CLIENTE");
  page.render();
  page.nodes("OrdersFilters")[0].props.onSearch();
  await Promise.resolve();
  assert.ok(page.requests[0].calls.some(call => call[0] === "eq" && call[1] === "id_cliente" && call[2] === 42));
  assert.ok(page.requests[0].calls.some(call => call[0] === "is" && call[1] === "deleted_at" && call[2] === null));
  assert.ok(page.requests[0].calls.some(call => call[0] === "select" && call[1].includes("financeiro:cash_flow_entries(status)")));
  page.requests[0].resolve({ error: { code: "42501" } });
  await new Promise(resolve => setImmediate(resolve));
  page.render();
  assert.match(page.nodes("Text").find(node => node.props.accessibilityRole === "alert").props.children, /permissão/);
  page.nodes("AnimatedButton").find(node => node.props.title === "Tentar novamente").props.onPress();
  assert.equal(page.requests.length, 2);
});

for (const [field, label] of [[0, "Cliente"], [1, "Produto"]]) {
  test(`${label} ignores an obsolete lookup response after editing`, async () => {
    const page = addScreen();
    page.nodes("TextInput")[field].props.onChangeText("1");
    page.render();
    const old = page.nodes("TextInput")[field].props.onBlur();
    page.nodes("TextInput")[field].props.onChangeText("2");
    page.render();
    const latest = page.nodes("TextInput")[field].props.onBlur();
    page.requests[1].resolve({ data: { id: 2, nome: "Atual" } });
    await latest;
    page.requests[0].resolve({ data: { id: 1, nome: "Obsoleto" } });
    await old;
    page.render();
    const text = JSON.stringify(page.nodes("Text").map(node => node.props.children));
    assert.match(text, /Atual/);
    assert.doesNotMatch(text, /Obsoleto/);
  });
}

test("quantity rejects fractions and unsafe integers", () => {
  const page = addScreen();
  for (const value of ["1,5", "1.5", "9007199254740992", "0"]) {
    page.nodes("TextInput")[2].props.onChangeText(value);
    page.render();
    assert.equal(page.nodes("TextInput")[2].props.onBlur(), false);
  }
  page.nodes("TextInput")[2].props.onChangeText("2");
  page.render();
  assert.equal(page.nodes("TextInput")[2].props.onBlur(), true);
});

test("orders require an explicit valid payment due date before persistence", async () => {
  const page = addScreen();
  for (const value of ["", "31/02/2026", "2026-11-20"]) {
    page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Vencimento do recebimento").props.onChangeText(value);
    page.render();
    await page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar Pedido").props.onPress();
    page.render();
    assert.equal(page.requests.length, 0);
    assert.match(JSON.stringify(page.nodes("Text")), /Informe o vencimento/);
  }
});

test("retry after an ambiguous network error keeps the same request key and due date", async () => {
  const page = addScreen();
  await addProduct(page, 10, 2);
  page.nodes("TextInput")[0].props.onChangeText("5");
  page.render();
  async function startSave() {
    const saving = page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar Pedido").props.onPress();
    page.requests.at(-1).resolve({ data: { id: 5, nome: "Cliente" } });
    await new Promise(resolve => setImmediate(resolve));
    return { saving, request: page.requests.at(-1) };
  }
  const first = await startSave();
  const payload = first.request.calls[0][2];
  first.request.reject(new TypeError("Failed to fetch"));
  await first.saving;
  page.render();
  const retry = await startSave();
  assert.deepEqual(retry.request.calls[0][2], payload);
  retry.request.resolve({ data: 99 });
  await retry.saving;
  page.render();
  assert.equal(page.nodes("TextInput").find(node => node.props.accessibilityLabel === "Vencimento do recebimento").props.value, "");
});

test("failed insertion releases loading, preserves fields and permits retry", async () => {
  const page = addScreen();
  for (let field = 0; field < 3; field++) page.nodes("TextInput")[field].props.onChangeText("2");
  page.render();
  const submit = page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar Pedido").props.onPress();
  page.render();
  assert.equal(page.nodes("TextInput")[0].props.editable, false);
  for (const request of page.requests) request.resolve({ data: { id: 2, nome: "Nome" } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.requests[2].table, "save_order_items");
  page.requests[2].resolve({ error: { code: "42501" } });
  await submit;
  page.render();
  assert.equal(page.nodes("TextInput")[0].props.value, "2");
  assert.equal(page.nodes("TextInput")[0].props.editable, true);
  assert.match(JSON.stringify(page.nodes("Text").map(node => node.props.children)), /permissão/);
  assert.equal(page.nodes("AnimatedButton").find(node => node.props.title === "Adicionar Pedido").props.disabled, false);
});
