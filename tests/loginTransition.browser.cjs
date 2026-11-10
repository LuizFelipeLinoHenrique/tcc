// Uses the same isolated browser dependencies as cashProjection.browser.cjs.
// Run: node tests/loginTransition.browser.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const root = path.resolve(__dirname, "..");
const runtime = path.join(root, ".expo/chart-tests");
const esbuild = require(path.join(runtime, "node_modules/esbuild"));
const { chromium } = require(path.join(runtime, "node_modules/playwright"));

async function main() {
  await esbuild.build({
    stdin: { contents: `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import { Text } from 'react-native';
      import { SafeAreaProvider } from 'react-native-safe-area-context';
      import { LoginTransitionProvider } from './src/components/LoginTransitionProvider';
      import SignIn from './app/(auth)/signIn';
      function App() {
        const [authenticated, setAuthenticated] = useState(false);
        window.setAuthenticated = setAuthenticated;
        return <SafeAreaProvider><LoginTransitionProvider>
          {authenticated ? <Text testID="dashboard">Painel aberto</Text> : <SignIn />}
        </LoginTransitionProvider></SafeAreaProvider>;
      }
      window.loginRequests = 0;
      createRoot(document.getElementById('root')).render(<App />);
    `, resolveDir: root, loader: "tsx" },
    outfile: path.join(runtime, "login-preview.js"), bundle: true, platform: "browser",
    alias: { "react-native": "react-native-web", "@": root },
    plugins: [{ name: "login-boundaries", setup(build) {
      build.onResolve({ filter: /(?:^@expo\/vector-icons$|^expo-router$|\/lib\/supabase$)/ }, args => ({ path: args.path, namespace: "login-mocks" }));
      build.onLoad({ filter: /.*/, namespace: "login-mocks" }, args => ({
        contents: args.path.endsWith("/supabase") ? `
          export const supabase = { auth: { signInWithPassword() {
            window.loginRequests++;
            return new Promise((resolve, reject) => {
              window.resolveLogin = outcome => {
                if (outcome === 'network') { reject(new Error('Offline')); return; }
                if (outcome === 'invalid') { resolve({ data: {session:null}, error: {message:'Invalid login credentials'} }); return; }
                if (outcome === 'empty') { resolve({ data: {session:null}, error: null }); return; }
                // Supabase notifies the navigator before resolving the sign-in promise.
                window.setAuthenticated(true);
                resolve({data:{session:{user:{id:'test-user'}}},error:null});
              };
            });
          } } };
        ` : args.path === "expo-router" ? `
          import React from 'react';
          export const router = {push(){}};
          export function Link({children}) {return React.createElement('span',null,children);}
        ` : `import React from 'react'; export function Ionicons(){return React.createElement('span',{'aria-hidden':true});}`,
        loader: "js", resolveDir: root,
      }));
    } }],
    resolveExtensions: [".web.tsx", ".tsx", ".web.ts", ".ts", ".web.js", ".js", ".json"],
    define: { "process.env.NODE_ENV": '"production"', "process.env.EXPO_OS": '"web"', __DEV__: "false", global: "globalThis" },
  });
  const server = http.createServer((req, res) => {
    if (req.url === "/preview.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(fs.readFileSync(path.join(runtime, "login-preview.js")));
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}body{font-family:Arial}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/preview.js"></script></body></html>');
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const url = `http://127.0.0.1:${server.address().port}`;
    const overlay = page.getByTestId("login-transition");
    const transform = testId => page.getByTestId(testId).evaluate(element => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return { x: matrix.m41, y: matrix.m42 };
    });
    const fill = async () => {
      await page.getByPlaceholder("voce@exemplo.com").fill("test@example.com");
      await page.getByPlaceholder("Digite sua senha").fill("test-password");
    };
    const start = async () => {
      await fill();
      await page.getByText("Entrar no Sistema", { exact: true }).click();
      await overlay.waitFor();
    };
    for (const viewport of [{ width: 375, height: 812 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(viewport);
      await page.goto(url);
      assert.equal(await overlay.count(), 0, "opening the login screen does not animate");
      await page.getByText("Entrar no Sistema", { exact: true }).click();
      assert.equal(await page.evaluate(() => window.loginRequests), 0, "empty fields do not authenticate");
      await start();
      const initial = await transform("login-pallet");
      await page.waitForTimeout(800);
      const lifted = await transform("login-pallet");
      assert.ok(lifted.y < initial.y - 20, "pallet lifts before loading");
      await page.getByText("Conferindo seu acesso", { exact: true }).waitFor();
      const loaded = await transform("login-pallet");
      assert.ok(loaded.x > initial.x + 90, "pallet moves onto the truck");
      assert.ok(loaded.y < initial.y - 20, "pallet settles above the truck bed");
      assert.equal((await transform("login-truck")).x, 0, "truck waits for successful authentication");
      assert.equal(await page.evaluate(() => window.loginRequests), 1, "one login request per submission");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "animation fits viewport");
      await page.screenshot({ path: path.join(runtime, `login-loaded-${viewport.width}.png`) });
      await page.evaluate(() => window.resolveLogin('success'));
      await page.getByTestId("dashboard").waitFor({ state: "attached" });
      assert.equal(await overlay.count(), 1, "animation survives the login screen unmounting");
      await page.waitForTimeout(1100);
      assert.ok((await transform("login-truck")).x > 50, "truck drives toward the edge of the screen");
      await page.screenshot({ path: path.join(runtime, `login-driving-${viewport.width}.png`) });
      await overlay.waitFor({ state: "detached" });
      assert.equal(await page.getByTestId("dashboard").isVisible(), true, "dashboard is revealed when departure finishes");
    }
    for (const [outcome, message] of [["invalid", "Credenciais inválidas."], ["network", "Não foi possível entrar. Verifique sua conexão e tente novamente."], ["empty", "Não foi possível entrar. Tente novamente."]]) {
      await page.goto(url);
      await start();
      await page.evaluate(value => window.resolveLogin(value), outcome);
      await overlay.waitFor({ state: "detached" });
      await page.getByText(message, { exact: true }).waitFor();
      assert.equal(await page.getByTestId("dashboard").count(), 0, "failed login never opens dashboard");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(url);
    await start();
    await page.getByText("Conferindo seu acesso", { exact: true }).waitFor();
    assert.equal((await transform("login-truck")).x, 0, "reduced motion keeps the truck still");
    await page.evaluate(() => window.resolveLogin('success'));
    await overlay.waitFor({ state: "detached", timeout: 1500 });
    assert.deepEqual(errors, [], "no browser runtime errors");
    console.log("Login animation: desktop/mobile loading and departure, navigation, validation, auth failures and reduced motion passed.");
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
