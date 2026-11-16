// Preparação: npm install --prefix .expo/dashboard-tests --no-save --package-lock=false playwright@1.56.1 esbuild@0.25.12
// Execução: node tests/dashboard.browser.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const root = path.resolve(__dirname, "..");
const runtime = path.join(root, ".expo/dashboard-tests");
const esbuild = require(path.join(runtime, "node_modules/esbuild"));
const { chromium } = require(path.join(runtime, "node_modules/playwright"));

async function main() {
  await esbuild.build({
    stdin: { contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { SafeAreaProvider } from 'react-native-safe-area-context';
      import { ErpShell } from './src/components/ErpShell';
      import Dashboard from './app/(tabs)/(home)/homeScreen';
      import regular from '@expo-google-fonts/work-sans/400Regular/WorkSans_400Regular.ttf';
      import medium from '@expo-google-fonts/work-sans/500Medium/WorkSans_500Medium.ttf';
      import semibold from '@expo-google-fonts/work-sans/600SemiBold/WorkSans_600SemiBold.ttf';
      import bold from '@expo-google-fonts/work-sans/700Bold/WorkSans_700Bold.ttf';
      const style=document.createElement('style');
      style.textContent=[['WorksansRegular',regular],['WorksansMedium',medium],['WorksansSemiBold',semibold],['WorksansBold',bold]].map(([name,url])=>'@font-face{font-family:'+name+';src:url('+url+')}').join('');
      document.head.appendChild(style);
      createRoot(document.getElementById('root')).render(<SafeAreaProvider><ErpShell onSignOut={()=>{}}><Dashboard/></ErpShell></SafeAreaProvider>);
    `, resolveDir: root, loader: "tsx" },
    outfile: path.join(runtime, "dashboard-preview.js"), bundle: true, platform: "browser",
    alias: { "react-native": "react-native-web", "@": root },
    plugins: [{ name: "dashboard-fixture", setup(build) {
      build.onResolve({ filter: /^expo-router$/ }, () => ({ path: "router", namespace: "fixture" }));
      build.onResolve({ filter: /\/lib\/supabase$/ }, () => ({ path: "supabase", namespace: "fixture" }));
      build.onResolve({ filter: /\/lib\/cashFlowRepository$/ }, () => ({ path: "cash", namespace: "fixture" }));
      build.onResolve({ filter: /^@expo\/vector-icons$/ }, () => ({ path: "icons", namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, args => {
        let contents;
        if (args.path === "router") contents = `import {useEffect} from 'react'; export const useFocusEffect=callback=>useEffect(callback,[callback]); export const usePathname=()=>'/homeScreen'; export const router={replace(){}};`;
        if (args.path === "icons") contents = `import React from 'react';export function Ionicons({name,size,color}) {return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 10h8M8 14h5"/></svg>}`;
        if (args.path === "cash") contents = `import {cashToday} from '${root.replace(/\\/g, "/")}/src/lib/cashFlow';
          export async function loadCashEntries(){
            const today=cashToday(); const [y,m]=today.split('-').map(Number);
            if(new URLSearchParams(location.search).has('empty')) return [];
            return Array.from({length:12},(_,i)=>{const date=new Date(y,m-12+i,5,12);const day=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-05';
              return [{id:'in'+i,type:'income',status:'paid',paid_date:day,due_date:day,amount_cents:(i+1)*137000}, {id:'out'+i,type:'expense',status:'paid',paid_date:day,due_date:day,amount_cents:i===11?2150000:(i+1)*81000}];}).flat().concat([
              {id:'pending-in',type:'income',status:'pending',due_date:today,amount_cents:1850000},
              {id:'pending-out',type:'expense',status:'pending',due_date:today,amount_cents:670000}]);
          } export const cashError=e=>e.message;`;
        if (args.path === "supabase") contents = `
          const empty=new URLSearchParams(location.search).has('empty');
          const clients=[{id:1,nome:'Distribuidora São Paulo e Região'},{id:2,nome:'Indústria de Embalagens Horizonte'},{id:3,nome:'Comercial Oliveira'},{id:4,nome:'Armazém Central'}];
          const products=[{id:1,nome:'Pallet de madeira reforçado'},{id:2,nome:'Caixa industrial retornável'},{id:3,nome:'Pallet padrão PBR'},{id:4,nome:'Estrutura de transporte'}];
          const now=new Date();const orders=Array.from({length:36},(_,i)=>({id:i+1,id_cliente:i%4+1,status:i%7===0?'C':i%3===0?'P':'E',data_pedido:new Date(now.getFullYear(),now.getMonth()-i%12,1).toISOString().slice(0,10),itens:[{id_produto:i%4+1,qtde:22+i*3,unit_price_cents:10000}]}));
          export const supabase={from(table){const query={select(){return query},is(){return query},then(resolve){return Promise.resolve({data:empty?[]:table==='pedidos'?orders:table==='produtos'?products:clients,count:empty?0:18,error:null}).then(resolve)}};return query}};`;
        return { contents, loader: "tsx", resolveDir: root };
      });
    } }],
    resolveExtensions: [".web.tsx", ".tsx", ".web.ts", ".ts", ".web.js", ".js", ".json"],
    loader: { ".ttf": "dataurl" }, define: { "process.env.NODE_ENV": '"production"', "process.env.EXPO_OS": '"web"', __DEV__: "false", global: "globalThis" },
  });
  const server = http.createServer((req, res) => {
    if (req.url === "/dashboard-preview.js") { res.setHeader("Content-Type", "text/javascript"); res.end(fs.readFileSync(path.join(runtime, "dashboard-preview.js"))); }
    else { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;background:#f3f6fa}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/dashboard-preview.js"></script></body></html>'); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.getByTestId("dashboard-partners").waitFor();
      await page.getByTestId("dashboard-trend").first().scrollIntoViewIfNeeded();
      await page.getByTestId("dashboard-trend").first().locator("svg").first().waitFor({ state: "attached" }).catch(async error => {
        await page.screenshot({ path: path.join(runtime, "dashboard-debug.png"), fullPage: true });
        console.error("Runtime errors:", errors);
        console.error(await page.getByTestId("dashboard-trend").first().evaluate(el => ({ html: el.outerHTML.slice(0, 1500), width: el.getBoundingClientRect().width })));
        throw error;
      });
      await page.evaluate(() => document.fonts.ready);
      for (const months of [3, 12]) {
        await page.getByRole("tab", { name: `${months} meses`, exact: true }).click();
        await page.waitForTimeout(1200);
        const geometry = await page.evaluate(() => {
          const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
          const content = box('[data-testid="dashboard-content"]');
          const sections = ["partners", "financial", "orders"].map(name => box(`[data-testid="dashboard-${name}"]`));
          const cards = [...document.querySelectorAll('[data-testid="dashboard-financial-card"], [data-testid="dashboard-financial-chart"], [data-testid="dashboard-orders-chart"], [data-testid="dashboard-ranking"]')].map(el => el.getBoundingClientRect().toJSON());
          const plots = [...document.querySelectorAll('[data-testid="dashboard-trend"]')].map(el => ({ available: el.getBoundingClientRect().width, scroll: el.scrollWidth }));
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, content, sections, cards, plots };
        });
        assert.ok(!geometry.overflow, `page overflow at ${width}/${months}`);
        assert.ok(geometry.sections[0].top < geometry.sections[1].top && geometry.sections[1].top < geometry.sections[2].top, "partners precede finance and orders");
        assert.ok(geometry.cards.every(card => card.left >= geometry.content.left - 1 && card.right <= geometry.content.right + 1), `cards overflow at ${width}/${months}: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.plots.every(plot => plot.scroll <= plot.available + 1), `plot overflow at ${width}/${months}: ${JSON.stringify(geometry.plots)}`);
        assert.equal(await page.getByTestId("dashboard-financial-card").count(), 3);
        assert.equal(await page.getByRole("tab", { name: `${months} meses`, exact: true }).getAttribute("aria-selected"), "true");
      }
      await page.screenshot({ path: path.join(runtime, `dashboard-${width}.png`), fullPage: true });
      console.log(`Dashboard validated at ${width}px (3 and 12 months).`);
    }
    await page.goto(`http://127.0.0.1:${server.address().port}/?empty`);
    await page.getByText("Nenhum cliente com pedidos ativos.", { exact: true }).waitFor();
    assert.ok(await page.getByText("Nenhum produto com demanda registrada.", { exact: true }).isVisible());
    assert.deepEqual(errors, []);
    console.log("Empty state validated; no browser runtime errors.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
