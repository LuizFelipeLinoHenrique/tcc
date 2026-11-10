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
function screen(file) {
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
    for (const method of ["select", "eq", "gt", "gte", "order", "limit", "maybeSingle", "single", "insert"]) {
      query[method] = (...args) => { request.calls.push([method, ...args]); return query; };
    }
    return query;
  } };
  const load = name => {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name === "react-native") return { StyleSheet: { create: styles => styles }, ...Object.fromEntries(["View", "Text", "TextInput", "ActivityIndicator", "FlatList", "ScrollView", "Pressable"].map(key => [key, key])) };
    if (name.endsWith("/supabase")) return { supabase };
    if (name.endsWith("/orderValidation")) return compile("src/lib/orderValidation.ts", load);
    if (name.endsWith("/pagination")) return compile("src/lib/pagination.ts", load);
    if (name.endsWith("/tableActions")) return compile("src/lib/tableActions.ts", load);
    if (name.endsWith("/colors")) return { Colors: {} };
    if (name.endsWith("/useResponsive")) return { __esModule: true, default: () => ({ isMobile: false }) };
    if (name.endsWith("/useRecordDeletion")) return { useRecordDeletion: () => ({}) };
    if (name.endsWith("/ScreensLayout")) return { PagesLayout: "PagesLayout", pagesStyles: {} };
    const key = name.split("/").at(-1);
    return { [key]: key, Ionicons: "Ionicons" };
  };
  const Component = compile(file, load).default;
  let tree;
  function render() { index = 0; tree = Component(); }
  function nodes(type, node = tree) {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(child => nodes(type, child ?? null));
    return [...(node.type === type ? [node] : []), ...nodes(type, node.props?.children ?? null)];
  }
  render();
  return { render, nodes, requests };
}

const addScreen = () => screen("app/(tabs)/(order)/addOrder.tsx");

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
  page.requests[0].resolve({ error: { code: "42501" } });
  await new Promise(resolve => setImmediate(resolve));
  page.render();
  assert.match(page.nodes("Text").find(node => node.props.accessibilityRole === "alert").props.children, /permissão/);
  page.nodes("AnimatedButton").find(node => node.props.title === "Tentar novamente").props.onPress();
  assert.equal(page.requests.length, 2);
});

for (const [field, label] of [[0, "Cliente"], [1, "Material"]]) {
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

test("failed insertion releases loading, preserves fields and permits retry", async () => {
  const page = addScreen();
  for (let field = 0; field < 3; field++) page.nodes("TextInput")[field].props.onChangeText("2");
  page.render();
  const submit = page.nodes("AnimatedButton")[0].props.onPress();
  page.render();
  assert.equal(page.nodes("TextInput")[0].props.editable, false);
  for (const request of page.requests) request.resolve({ data: { id: 2, nome: "Nome" } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(page.requests[2].table, "pedidos");
  page.requests[2].resolve({ error: { code: "42501" } });
  await submit;
  page.render();
  assert.equal(page.nodes("TextInput")[0].props.value, "2");
  assert.equal(page.nodes("TextInput")[0].props.editable, true);
  assert.match(JSON.stringify(page.nodes("Text").map(node => node.props.children)), /permissão/);
  assert.equal(page.nodes("AnimatedButton")[0].props.disabled, false);
});
