const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../src/lib/pagination.ts"), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const mod = { exports: {} };
new Function("module", "exports", outputText)(mod, mod.exports);
const { createPagination, mergeById } = mod.exports;

test("repeated end-of-list events cannot request the same page concurrently", () => {
  const pagination = createPagination();
  const initial = pagination.begin(true);
  pagination.accept(initial, [{ id: 109 }, { id: 110 }], 2);
  pagination.finish(initial);
  const next = pagination.begin(false);
  assert.equal(next.cursor, 110);
  assert.equal(pagination.begin(false), null);
  pagination.accept(next, [{ id: 111 }, { id: 112 }], 2);
  pagination.finish(next);
  assert.equal(pagination.begin(false).cursor, 112);
});

test("pagination is blocked before the initial search and during debounce", () => {
  const pagination = createPagination();
  assert.equal(pagination.begin(false), null);
  const initial = pagination.begin(true);
  pagination.accept(initial, [{ id: 110 }], 1);
  pagination.finish(initial);
  pagination.invalidate();
  assert.equal(pagination.begin(false), null);
  assert.equal(pagination.isCurrent(initial), false);
});

test("a late response cannot overwrite a reset search or unlock its request", () => {
  const pagination = createPagination();
  const old = pagination.begin(true);
  const current = pagination.begin(true);
  assert.equal(current.cursor, null);
  assert.equal(pagination.isCurrent(old), false);
  pagination.accept(old, [{ id: 999 }], 1);
  pagination.finish(old);
  assert.equal(pagination.begin(false), null);
  pagination.accept(current, [{ id: 110 }], 1);
  pagination.finish(current);
  assert.equal(pagination.begin(false).cursor, 110);
});

test("overlapping pages keep unique IDs and update existing records", () => {
  const result = mergeById(
    [{ id: 109, nome: "A" }, { id: 110, nome: "Antigo" }],
    [{ id: 110, nome: "Atualizado" }, { id: 111, nome: "Novo" }, { id: 111, nome: "Novo" }],
  );
  assert.deepEqual(result.map(row => row.id), [109, 110, 111]);
  assert.equal(result[1].nome, "Atualizado");
  assert.deepEqual(mergeById([], [{ id: 110 }, { id: 110 }]), [{ id: 110 }]);
});

test("the final page stops requests; a new search starts at the beginning", () => {
  const pagination = createPagination();
  const request = pagination.begin(true);
  pagination.accept(request, [{ id: 110 }], 50);
  pagination.finish(request);
  assert.equal(pagination.begin(false), null);
  assert.equal(pagination.begin(true).cursor, null);
});

test("failed pages can retry the same cursor after releasing the lock", () => {
  const pagination = createPagination();
  const initial = pagination.begin(true);
  pagination.accept(initial, [{ id: 110 }], 1);
  pagination.finish(initial);
  const failed = pagination.begin(false);
  pagination.finish(failed);
  assert.equal(pagination.begin(false).cursor, 110);
});
