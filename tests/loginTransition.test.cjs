const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const React = require("react");
const { act, create } = require("react-test-renderer");
const ts = require("typescript");

test("slow login unlocks the screen and prevents another request until it settles", async () => {
  const source = fs.readFileSync(path.join(__dirname, "../src/components/LoginTransitionProvider.tsx"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const mod = { exports: {} };
  let timer;
  const load = name => {
    if (name === "react-native") return { View: "View", StyleSheet: { create: styles => styles } };
    if (name.endsWith("/LoginTruckAnimation")) return { LoginTruckAnimation: "Animation" };
    return require(name);
  };
  new Function("require", "module", "exports", "setTimeout", "clearTimeout", outputText)(
    load, mod, mod.exports,
    callback => { timer = callback; return 1; },
    () => { timer = undefined; },
  );

  const { LoginTransitionProvider, useLoginTransition } = mod.exports;
  let transition;
  function Form() {
    transition = useLoginTransition();
    return null;
  }

  const previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let screen;
  try {
    await act(() => {
      screen = create(React.createElement(LoginTransitionProvider, null, React.createElement(Form)));
    });

    for (const settle of ["succeed", "cancel"]) {
      await act(() => { assert.equal(transition.start(), true); });
      assert.equal(screen.root.findAllByType("Animation").length, 1);
      await act(() => { timer(); });
      assert.equal(transition.slow, true);
      assert.equal(screen.root.findAllByType("Animation").length, 0);
      assert.equal(transition.start(), false);
      await act(() => { transition[settle](); });
      assert.equal(transition.slow, false);
      assert.equal(screen.root.findAllByType("Animation").length, 0);
    }

    await act(() => { assert.equal(transition.start(), true); });
    await act(() => { transition.succeed(); });
    assert.equal(timer, undefined);
    const animation = screen.root.findByType("Animation");
    assert.equal(animation.props.ready, true);
    await act(() => { animation.props.onComplete(); });
    assert.equal(screen.root.findAllByType("Animation").length, 0);
  } finally {
    if (screen) await act(() => { screen.unmount(); });
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});
