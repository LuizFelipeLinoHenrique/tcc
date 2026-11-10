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
    () => ({ supabase }),
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

test("material editing supports all four accented/unaccented column combinations", () => {
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
  assert.equal(result.nome_material, "Material indisponível");
  assert.equal(result.preco_total, 0);
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
