const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function setup() {
  let index = 0, closed = 0;
  const hooks = [], requests = [];
  const react = {
    useRef(value) { const i = index++; return hooks[i] ??= { current: value }; },
    useState(value) { const i = index++; if (!(i in hooks)) hooks[i] = value; return [hooks[i], v => { hooks[i] = v; }]; },
  };
  const jsx = (type, props) => ({ type, props });
  const load = name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return { Modal: 'Modal' };
    if (name.endsWith('/supabase')) return { supabase: { auth: { signOut() { return new Promise((resolve, reject) => requests.push({ resolve, reject })); } } } };
    return { __esModule: true, default: 'ConfirmationCard' };
  };
  const code = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, '../src/components/SignOutConfirmation.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(load, mod, mod.exports);
  return { requests, get closed() { return closed; }, render() { index = 0; return mod.exports.default({ onClose() { closed++; } }); } };
}

test('logout cancellation keeps session and pending logout blocks repeated clicks and dismissal', async () => {
  const page = setup();
  page.render().props.children.props.setCardConfirmation(false);
  assert.equal(page.closed, 1);
  assert.equal(page.requests.length, 0);
  const action = page.render().props.children.props.action;
  const pending = action();
  await action();
  const modal = page.render();
  assert.equal(modal.props.children.props.busy, true);
  modal.props.onRequestClose();
  assert.equal(page.closed, 1);
  assert.equal(page.requests.length, 1);
  page.requests[0].resolve({ error: null });
  await pending;
  assert.equal(page.closed, 2);
});

test('server and network logout errors remain visible and allow retry', async () => {
  for (const network of [false, true]) {
    const page = setup();
    const pending = page.render().props.children.props.action();
    if (network) page.requests[0].reject(new Error('Offline'));
    else page.requests[0].resolve({ error: { message: 'Server failure' } });
    await pending;
    const card = page.render().props.children.props;
    assert.equal(page.closed, 0);
    assert.equal(card.busy, false);
    assert.match(card.error, /Não foi possível desconectar/);
    const retry = card.action();
    assert.equal(page.render().props.children.props.error, null);
    page.requests[1].resolve({ error: null });
    await retry;
    assert.equal(page.closed, 1);
  }
});
