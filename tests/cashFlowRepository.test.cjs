const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/lib/cashFlowRepository.ts"), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });

function repository(responses, user = { id: "owner" }) {
  const calls = [];
  const supabase = { auth: { getUser: async () => ({ data: { user }, error: null }) }, from(table) {
    calls.push(["from", table]);
    const query = {};
    for (const name of ["select", "order", "limit", "gt", "eq", "update", "insert", "delete"]) query[name] = (...args) => { calls.push([name, ...args]); return query; };
    query.then = (resolve, reject) => Promise.resolve(responses.shift()).then(resolve, reject);
    return query;
  } };
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(() => ({ supabase }), mod, mod.exports);
  return { ...mod.exports, calls };
}

test("cash balances load all pages using a stable ID cursor", async () => {
  const first = Array.from({ length: 500 }, (_, id) => ({ id: String(id).padStart(4, "0") }));
  const repo = repository([{ data: first, error: null }, { data: [{ id: "0500" }], error: null }]);
  const records = await repo.loadCashEntries();
  assert.equal(records.length, 501);
  assert.deepEqual(repo.calls.filter(call => call[0] === "gt"), [["gt", "id", "0499"]]);
});

test("a failed page cannot return partial cash balances", async () => {
  const repo = repository([{ data: Array.from({ length: 500 }, (_, id) => ({ id: String(id) })), error: null }, { data: null, error: new Error("offline") }]);
  await assert.rejects(repo.loadCashEntries(), /offline/);
});

test("recurring records are inserted together and ownership is enforced", async () => {
  const drafts = [{ description: "Primeiro", user_id: "forged" }, { description: "Segundo" }];
  const repo = repository([{ data: [{ id: "a" }, { id: "b" }], error: null }]);
  assert.equal((await repo.saveCashEntries(drafts)).length, 2);
  assert.deepEqual(repo.calls.find(call => call[0] === "insert")[1], [{ description: "Primeiro", user_id: "owner" }, { description: "Segundo", user_id: "owner" }]);
  assert.equal(repo.calls.filter(call => call[0] === "insert").length, 1);
});

test("updates target one record belonging to the authenticated owner", async () => {
  const repo = repository([{ data: [{ id: "entry-id" }], error: null }]);
  await repo.saveCashEntries([{ description: "Atualizado" }], "entry-id");
  assert.deepEqual(repo.calls.filter(call => call[0] === "eq"), [["eq", "id", "entry-id"], ["eq", "user_id", "owner"]]);
});

test("updates and deletes reject zero affected rows", async () => {
  const repo = repository([{ data: [], error: null }, { data: [], error: null }]);
  await assert.rejects(repo.saveCashEntries([{}], "missing"), /não foi encontrado/);
  await assert.rejects(repo.deleteCashEntry("missing"), /não foi encontrado/);
});

test("expired sessions cannot write cash records", async () => {
  const repo = repository([], null);
  await assert.rejects(repo.saveCashEntries([{}]), /sessão expirou/);
  assert.equal(repo.calls.length, 0);
});
