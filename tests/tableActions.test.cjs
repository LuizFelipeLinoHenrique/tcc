const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

test("user errors distinguish connection, validation and permission failures", () => {
  const { recordError } = loadActions([]);
  assert.match(recordError(new TypeError("Failed to fetch")), /conexão/);
  assert.match(recordError({ code: "23514" }), /inválidos/);
  assert.match(recordError({ code: "42501" }), /permissão/);
  assert.match(recordError({ code: "PGRST301" }), /sessão expirou/);
});

// Exercise the actual data operations without touching production records.
function loadActions(responses = []) {
  const queries = [];
  const supabase = {
    from(table) {
      const response = responses.shift();
      assert.ok(response, `Unexpected query on ${table}`);
      const calls = [["from", table]];
      queries.push(calls);
      const query = {
        then(resolve, reject) {
          return Promise.resolve(response).then(resolve, reject);
        },
      };
      for (const method of [
        "select",
        "delete",
        "update",
        "eq",
        "is",
        "single",
        "maybeSingle",
      ]) {
        query[method] = (...args) => {
          calls.push([method, ...args]);
          return query;
        };
      }
      return query;
    },
  };
  supabase.rpc = async (name, args) => {
    queries.push([["rpc", name, args]]);
    const response = responses.shift();
    assert.ok(response, `Unexpected RPC ${name}`);
    return response;
  };
  const source = fs.readFileSync(
    path.join(__dirname, "../src/lib/tableActions.ts"),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    name => {
      if (name === "./orderItems") {
        const helper = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src/lib/orderItems.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
        const loaded = { exports: {} };
        new Function("module", "exports", helper.outputText)(loaded, loaded.exports);
        return loaded.exports;
      }
      return { supabase };
    },
    mod,
    mod.exports,
  );
  return { ...mod.exports, queries };
}

test("deletion targets one ID and requires a returned row", async () => {
  const actions = loadActions([{ data: [{ id: 42 }], error: null }]);
  await actions.deleteRecord("clientes", 42);
  assert.deepEqual(actions.queries[0], [
    ["from", "clientes"],
    ["delete"],
    ["eq", "id", 42],
    ["select", "id"],
  ]);
});

test("order deletion uses the transactional cancellation and payment checks", async () => {
  const actions = loadActions([{ data: 266, error: null }]);
  await actions.deleteRecord("pedidos", 266);
  assert.deepEqual(actions.queries, [[["rpc", "delete_cancelled_order", { p_pedido: 266 }]]]);
  const failure = { code: "P0001", message: "Cancele o pedido antes de excluí-lo" };
  await assert.rejects(loadActions([{ error: failure }]).deleteRecord("pedidos", 1), error => error === failure);
  const paidFailure = { code: "P0001", message: "Pedido com recebimento realizado não pode ser excluído" };
  await assert.rejects(loadActions([{ error: paidFailure }]).deleteRecord("pedidos", 279), error => error === paidFailure);
  assert.equal(actions.recordError(paidFailure), paidFailure.message);
  await assert.rejects(loadActions([{ data: null }]).deleteRecord("pedidos", 1), /não foi excluído/);
});

test("deletion and update do not report success when no rows were changed", async () => {
  const actions = loadActions([
    { data: [], error: null },
    { data: [], error: null },
  ]);
  await assert.rejects(actions.deleteRecord("produtos", 7), /não foi excluído/);
  await assert.rejects(
    actions.updateRecord("pedidos", 8, { qtde: 3 }),
    /não foi atualizado/,
  );
});

test("update targets the selected record and preserves its payload", async () => {
  const actions = loadActions([{ data: [{ id: 12 }], error: null }]);
  await actions.updateRecord("fornecedores", 12, { nome: "Fornecedor" });
  assert.deepEqual(actions.queries[0], [
    ["from", "fornecedores"],
    ["update", { nome: "Fornecedor" }],
    ["eq", "id", 12],
    ["select", "id"],
  ]);
});

test("foreign key and permission errors reach the user", async () => {
  const failure = { code: "23503", message: "foreign key violation" };
  const actions = loadActions([{ data: null, error: failure }]);
  await assert.rejects(
    actions.deleteRecord("clientes", 1),
    (error) => error === failure,
  );
  assert.match(actions.recordError(failure), /vinculado/);
  assert.match(actions.recordError({ code: "42501" }), /permissão/);
  assert.match(actions.recordError({ code: "23505" }), /Já existe/);
});

test("product editing supports all four accented/unaccented column combinations", () => {
  const { materialValues } = loadActions();
  for (const desc of ["descricao", "descrição"]) {
    for (const price of ["preco", "preço"]) {
      assert.deepEqual(
        materialValues(
          { [desc]: null, [price]: null },
          "Madeira",
          "Nova descrição",
          29.5,
        ),
        {
          nome: "Madeira",
          [desc]: "Nova descrição",
          [price]: 29.5,
        },
      );
    }
  }
});

test("order details use the selected order, related IDs and accented prices", async () => {
  const actions = loadActions([
    {
      data: {
        id: 4,
        id_cliente: 2,
        id_produto: 3,
        qtde: 5,
        status: "P",
        data_pedido: "2026-11-09",
      },
      error: null,
    },
    {
      data: { nome: "Cliente", telefone: 11999999999, endereco: "Rua A" },
      error: null,
    },
    {
      data: { nome: "Madeira", descrição: "Maciça", preço: "12.50" },
      error: null,
    },
  ]);
  const result = await actions.getOrderDetails(4);
  assert.equal(result.id_pedido, 4);
  assert.equal(result.preco_total, 62.5);
  assert.equal(result.descricao_material, "Maciça");
  assert.equal(result.telefone_cliente, "11999999999");
  assert.ok(
    actions.queries[1].some((call) => call[0] === "eq" && call[2] === 2),
  );
  assert.ok(
    actions.queries[2].some((call) => call[0] === "eq" && call[2] === 3),
  );
});

test("missing related records do not leave order details blank", async () => {
  const actions = loadActions([
    { data: { id: 4, id_cliente: 2, id_produto: 3, qtde: 5 }, error: null },
    { data: null, error: null },
    { data: null, error: null },
  ]);
  const result = await actions.getOrderDetails(4);
  assert.equal(result.nome_cliente, "Cliente indisponível");
  assert.equal(result.nome_material, "Produto indisponível");
  assert.equal(result.preco_total, 0);
});

test("multi-product details total every item and preserve each quantity and price", async () => {
  const actions = loadActions([
    { data: { id: 4, id_cliente: 2, id_produto: 3, qtde: 5, itens: [{ id_produto: 3, qtde: 5 }, { id_produto: 8, qtde: 2 }] } },
    { data: { nome: "Cliente" } },
    { data: { nome: "Madeira", preco: 12.5 } },
    { data: { nome: "Pallet", preco: 100 } },
  ]);
  const details = await actions.getOrderDetails(4);
  assert.equal(details.preco_total, 262.5);
  assert.equal(details.qtde_pedido, 7);
  assert.deepEqual(details.produtos.map(item => [item.nome, item.qtde, item.preco_total]), [["Madeira", 5, 62.5], ["Pallet", 2, 200]]);
});

test("order details preserve sale prices after catalog changes, including a free item", async () => {
  const actions = loadActions([
    { data: { id: 4, id_cliente: 2, id_produto: 3, qtde: 3, itens: [{ id_produto: 3, qtde: 3, unit_price_cents: 1250 }, { id_produto: 8, qtde: 2, unit_price_cents: 0 }] } },
    { data: { nome: "Cliente" } },
    { data: { nome: "Madeira", preco: 999 } },
    { data: { nome: "Amostra", preco: 100 } },
  ]);
  const details = await actions.getOrderDetails(4);
  assert.equal(details.preco_unit, 12.5);
  assert.equal(details.preco_total, 37.5);
  assert.deepEqual(details.produtos.map(item => item.preco_unit), [12.5, 0]);
});

test("financial business errors explain why the operation was blocked", () => {
  const actions = loadActions();
  assert.equal(actions.recordError({ code: "P0001", message: "Pedido com histórico financeiro não pode ser excluído" }), "Pedido com histórico financeiro não pode ser excluído");
});

test("order lookup errors and related query errors propagate", async () => {
  const failure = { code: "PGRST116" };
  await assert.rejects(
    loadActions([{ error: failure }]).getOrderDetails(4),
    (error) => error === failure,
  );
  const actions = loadActions([
    { data: { id: 4, id_cliente: 2, id_produto: 3 }, error: null },
    { data: null, error: failure },
    { data: null, error: null },
  ]);
  await assert.rejects(
    actions.getOrderDetails(4),
    (error) => error === failure,
  );
});
