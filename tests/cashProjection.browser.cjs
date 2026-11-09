// Preparação isolada: npm install --prefix .expo/chart-tests --no-save --package-lock=false playwright@1.56.1 esbuild@0.25.12
// Execução: node tests/cashProjection.browser.cjs
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
      import { CashProjection } from './src/components/CashProjection';
      import { CashAnalyticsPanels } from './src/components/CashAnalyticsPanels';
      import { useWindowDimensions } from 'react-native';
      function App() {
        const {width} = useWindowDimensions();
        const [days, setDays] = useState(30);
        const [scenario, setScenario] = useState('mixed');
        const points = Array.from({length: days + 2}, (_, i) => {
          const date = new Date(2026, 10, 9 + i);
          const balance = scenario === 'zero' ? 0 : scenario === 'negative' ? -100000 - i * 5000 : scenario === 'positive' ? 100000 + i * 3000 : i < 15 ? 100000 : i < 35 ? -150000 : 200000;
          return {date: date.toISOString().slice(0,10), balance};
        });
        return <main style={{maxWidth: 900, margin: 'auto', padding: 16}}>
          <nav>{[30,60,90].map(value => <button key={value} onClick={() => setDays(value)}>{value} dias</button>)}{['mixed','negative','positive','zero'].map(value => <button key={value} onClick={() => setScenario(value)}>{value}</button>)}</nav>
          <section data-testid="cash" style={{marginTop: 16}}>
            <CashAnalyticsPanels compact={width < 800} panelStyle={{backgroundColor:'white',padding:20,borderRadius:10,gap:16,minWidth:0}}
              projection={<CashProjection points={points}/>}
              categoryHeader={<div data-testid="category-heading">Saídas por categoria</div>}>
              {Array.from({length:24},(_,i)=><div key={i} style={{minHeight:44}}>Categoria {i+1} • R$ 100,00</div>)}
            </CashAnalyticsPanels>
          </section>
        </main>;
      }
      createRoot(document.getElementById('root')).render(<App/>);
    `, resolveDir: root, loader: "tsx" },
    outfile: path.join(runtime, "preview.js"), bundle: true, platform: "browser",
    alias: { "react-native": "react-native-web", "@": root },
    // O harness dispensa apenas o carregador de fontes do Expo; os gráficos e RN Web são reais.
    plugins: [{ name: "expo-icon-font", setup(build) {
      build.onResolve({filter: /^@expo\/vector-icons$/}, () => ({path: "icons", namespace: "test-icons"}));
      build.onLoad({filter: /.*/, namespace: "test-icons"}, () => ({
        contents: `import React from 'react'; export function Ionicons(){return React.createElement('span',{'aria-hidden':true},'↗');}`,
        loader: "js", resolveDir: root,
      }));
    } }],
    resolveExtensions: [".web.tsx", ".tsx", ".web.ts", ".ts", ".web.js", ".js", ".json"],
    loader: { ".ttf": "dataurl" }, define: { "process.env.NODE_ENV": '"production"', "process.env.EXPO_OS": '"web"', __DEV__: "false", global: "globalThis" },
  });
  const server = http.createServer((req, res) => {
    if (req.url === "/preview.js") { res.setHeader("Content-Type", "text/javascript"); res.end(fs.readFileSync(path.join(runtime, "preview.js"))); }
    else { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f3f6fa;font-family:Arial}button{margin:4px;padding:8px}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/preview.js"></script></body></html>'); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => { errors.push(error.message); console.error("Browser:", error.message); });
    page.on("console", message => { if (message.type() === "error") { errors.push(message.text()); console.error("Console:", message.text()); } });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    let cases = 0;
    for (const viewport of [{width:1280,height:1100}, {width:375,height:1000}]) {
      await page.setViewportSize(viewport);
      await page.getByRole("button", { name: "30 dias", exact: true }).click();
      await page.getByRole("button", { name: "mixed", exact: true }).click();
      await page.waitForTimeout(950);
      await page.getByRole("button", { name: "60 dias", exact: true }).click();
      const readTip = () => page.evaluate(() => {
        const line = document.querySelector('[data-testid="cash-line"]');
        const tip = document.querySelector('[data-testid="cash-line-tip"]');
        const length = line.getTotalLength();
        const end = line.getPointAtLength(length);
        const x = Number(tip.getAttribute('cx')), y = Number(tip.getAttribute('cy'));
        return { length, x, y, error: Math.hypot(x-end.x,y-end.y) };
      });
      await page.waitForTimeout(150);
      const early = await readTip();
      await page.waitForTimeout(250);
      const middle = await readTip();
      assert.ok(middle.length > early.length, "period change progressively draws the line");
      assert.ok(early.error < 0.01 && middle.error < 0.01, "tip follows the visible line endpoint");
      await page.waitForTimeout(550);
      const finished = await readTip();
      assert.ok(finished.length > middle.length, "animation reaches the final balance");
      // Uma nova seleção cancela a animação anterior e termina no período mais recente.
      for (const days of [30, 90, 60]) {
        await page.getByRole("button", { name: days + " dias", exact: true }).click();
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(950);
      const settled = await readTip();
      assert.ok(Math.abs(settled.length - finished.length) < 0.01, "rapid period changes settle on the latest selection");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForTimeout(100);
      await page.getByRole("button", { name: "90 dias", exact: true }).click();
      await page.waitForTimeout(100);
      const reduced = await page.locator('[data-testid="cash-line"]').getAttribute('d');
      assert.equal((reduced.match(/L /g) || []).length, 91, "reduced motion shows the complete series immediately");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      for (const days of [30,60,90]) {
        await page.getByRole("button", { name: days + " dias", exact: true }).click();
        for (const scenario of ["mixed", "negative", "positive", "zero"]) {
          await page.getByRole("button", { name: scenario, exact: true }).click();
          await page.locator('[data-testid="cash-line"]').waitFor({ state: "attached" });
          await page.waitForTimeout(200);
          const geometry = await page.evaluate(() => {
            const svg = document.querySelector('[data-testid="cash-line-plot"]');
            const line = document.querySelector('[data-testid="cash-line"]');
            const rect = svg.querySelector('clipPath rect');
            const left = Number(rect.getAttribute('x')), top = Number(rect.getAttribute('y'));
            const right = left + Number(rect.getAttribute('width')), bottom = top + Number(rect.getAttribute('height'));
            const radius = Number(line.getAttribute('stroke-width')) / 2;
            const length = line.getTotalLength();
            const outliers = [];
            for(let i = 0; i <= 1000; i++) {
              const p = line.getPointAtLength(length * i / 1000);
              if (p.x - radius < left || p.x + radius > right || p.y - radius < top || p.y + radius > bottom) outliers.push({x:p.x,y:p.y});
            }
            return { outliers, d: line.getAttribute('d'), height: svg.getBoundingClientRect().height };
          });
          assert.deepEqual(geometry.outliers, [], "the entire line, including its stroke, stays within plot bounds");
          assert.ok(!/NaN|Infinity|[CQ]/.test(geometry.d), "finite straight segments without overshoot");
          assert.equal(geometry.height, 176);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
          assert.ok(!overflow, "charts must not overflow the page on mobile");
          const vertical = await page.evaluate(() => {
            const card = document.querySelector('[data-testid="cash"]');
            const plot = card.querySelector('[data-testid="cash-line-plot"]');
            const graph = card.querySelector('[data-testid="cash-projection"]');
            const plotRect = plot.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            return { height: plotRect.height, top: plotRect.top, bottom: plotRect.bottom, cardTop: cardRect.top, cardBottom: cardRect.bottom, graphHeight: graph?.getBoundingClientRect().height };
          });
          assert.ok(vertical.height <= 240, `combined positive/negative plot exceeds vertical budget: ${JSON.stringify(vertical)}`);
          assert.ok(vertical.graphHeight <= 300, `entire projection block exceeds vertical budget: ${JSON.stringify(vertical)}`);
          assert.ok(vertical.top >= vertical.cardTop && vertical.bottom <= vertical.cardBottom, "plot stays inside the card vertically");
          const categoryLayout = await page.evaluate(() => {
            const projection = document.querySelector('[data-testid="cash-projection-card"]');
            const categories = document.querySelector('[data-testid="cash-categories-card"]');
            const scroll = document.querySelector('[data-testid="cash-categories-scroll"]');
            const heading = document.querySelector('[data-testid="category-heading"]');
            const headingBefore = heading.getBoundingClientRect().top;
            const pageBefore = window.scrollY;
            scroll.scrollTop = 150;
            return { projectionHeight: projection.getBoundingClientRect().height, categoryHeight: categories.getBoundingClientRect().height,
              contentHeight: scroll.scrollHeight, viewportHeight: scroll.clientHeight, scrollTop: scroll.scrollTop,
              headingStayed: heading.getBoundingClientRect().top === headingBefore, pageStayed: window.scrollY === pageBefore };
          });
          assert.ok(Math.abs(categoryLayout.projectionHeight - categoryLayout.categoryHeight) < 1, `cards must have equal heights: ${JSON.stringify(categoryLayout)}`);
          assert.ok(categoryLayout.contentHeight > categoryLayout.viewportHeight && categoryLayout.scrollTop > 0, "overflowing categories scroll within the card");
          assert.ok(categoryLayout.headingStayed && categoryLayout.pageStayed, "category scrolling keeps heading and page fixed");
          if (days === 90 && scenario === "mixed") await page.screenshot({path:path.join(runtime,`cash-projection-${viewport.width}.png`),fullPage:true});
          cases++;
        }
      }
      console.log(`PASS: ${viewport.width}px, moving endpoint, interrupted transitions, reduced motion, horizons 30/60/90, mixed/negative/positive/zero`);
    }
    assert.deepEqual(errors, [], "no runtime or React console errors");
    console.log(`PASS: ${cases} browser scenarios; equal card heights, internal category scrolling with fixed heading, bounded plot, no runtime errors.`);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
