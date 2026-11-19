// Uses the existing browser test runtime: .expo/dashboard-tests (playwright and esbuild).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const Excel = require("exceljs");
const root = path.resolve(__dirname, "..");
const runtime = path.join(root, ".expo/dashboard-tests");
const esbuild = require(path.join(runtime, "node_modules/esbuild"));
const { chromium } = require(path.join(runtime, "node_modules/playwright"));

async function main() {
  const outfile = path.join(runtime, "cash-report-preview.js");
  await esbuild.build({
    stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import CashFlow from './app/(tabs)/cashFlow';createRoot(document.getElementById('root')).render(<CashFlow/>);`, resolveDir: root, loader: "tsx" },
    outfile, bundle: true, platform: "browser", alias: { "react-native": "react-native-web", "@": root },
    resolveExtensions: [".web.tsx", ".tsx", ".web.ts", ".ts", ".web.js", ".js", ".json"],
    define: { "process.env.NODE_ENV": '"production"', "process.env.EXPO_OS": '"web"', __DEV__: "false", global: "globalThis" },
    plugins: [{ name: "cash-fixture", setup(build) {
      build.onResolve({ filter: /^expo-router$/ }, () => ({ path: "router", namespace: "fixture" }));
      build.onResolve({ filter: /\/lib\/cashFlowRepository$/ }, () => ({ path: "repository", namespace: "fixture" }));
      build.onResolve({ filter: /\/components\/CashEntryForm$/ }, () => ({ path: "form", namespace: "fixture" }));
      build.onResolve({ filter: /^@expo\/vector-icons$/ }, () => ({ path: "icons", namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, args => {
        let contents;
        if (args.path === "router") contents = `import {useEffect} from 'react';export const useFocusEffect=callback=>useEffect(callback,[callback]);`;
        if (args.path === "form") contents = "export const CashEntryForm=()=>null;";
        if (args.path === "icons") contents = "export const Ionicons=()=>null;";
        if (args.path === "repository") contents = `import {cashToday} from '${root.replace(/\\/g, "/")}/src/lib/cashFlow';
          export async function loadCashEntries(){
            if(location.search.includes('empty')) return [];
            if(location.search.includes('error')) throw new Error('Falha ao carregar');
            const prefix=cashToday().slice(0,7);
            return Array.from({length:32},(_,i)=>({id:'record-'+i,user_id:'user',description:'Venda '+i,type:i%2?'expense':'income',category:'Vendas',account:'Caixa',amount_cents:12345,due_date:prefix+'-01',paid_date:i%3===0?prefix+'-01':null,status:i===31?'cancelled':i%3===0?'paid':'pending',notes:'Observação '+i,created_at:prefix+'-01T12:00:00Z'}));
          }export const cashError=e=>e.message;export async function deleteCashEntry(){}`;
        return { contents, loader: "tsx", resolveDir: root };
      });
    } }],
  });
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/bundle.js")) { res.setHeader("Content-Type", "application/javascript"); res.end(fs.readFileSync(outfile)); }
    else { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{margin:0;width:100%;height:100%;background:#f3f6fa}*{box-sizing:border-box}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({ acceptDownloads: true });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const url = `http://127.0.0.1:${server.address().port}`;
    for (const width of [390, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      const open = page.getByRole("button", { name: "Exportar relatório mensal", exact: true });
      await open.waitFor();
      await assert.doesNotReject(() => open.click());
      await page.getByRole("button", { name: "Fechar", exact: true }).click();
      await page.getByRole("textbox", { name: "Buscar movimentações" }).fill("does-not-match-any-entry");
      await open.click();
      assert.ok(await page.getByText("Os filtros da lista não limitam o relatório.", { exact: false }).isVisible());
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(runtime, `cash-report-modal-${width}.png`), fullPage: true });
      for (const format of ["XLSX", "PDF"]) {
        if (format === "PDF") await open.click();
        const downloadPromise = page.waitForEvent("download");
        await page.getByRole("button", { name: `Baixar ${format}`, exact: true }).click();
        const download = await downloadPromise;
        assert.match(download.suggestedFilename(), new RegExp(`^fluxo-de-caixa-\\d{4}-\\d{2}\\.${format.toLowerCase()}$`));
        const output = path.join(runtime, `cash-report-${width}.${format.toLowerCase()}`);
        await download.saveAs(output);
        if (format === "XLSX") {
          const book = new Excel.Workbook(); await book.xlsx.readFile(output);
          assert.equal(book.worksheets.length, 4);
          assert.equal(book.getWorksheet("Lançamentos"), undefined);
          assert.equal(book.getWorksheet("Sobre o relatório"), undefined);
          const sheet = book.getWorksheet("Lançamentos por situação");
          assert.equal(sheet.getCell("B2").value, 32, "metrics include all 32 records despite pagination and text filter");
          assert.equal(book.getWorksheet("Resumo financeiro").getCell("B3").value, 740.7);
        } else {
          const pdf = fs.readFileSync(output).toString("latin1");
          assert.ok(pdf.startsWith("%PDF-")); assert.ok(pdf.includes("740,70"));
          assert.ok(!pdf.includes("record-31")); assert.ok(!pdf.includes("Venda 31"));
        }
        await page.getByText("Download do relatório mensal iniciado.", { exact: true }).waitFor();
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      console.log(`PASS ${width}px: PDF and XLSX contain metrics for the complete month with active filters.`);
    }
    await page.goto(url + "/?empty");
    const open = page.getByRole("button", { name: "Exportar relatório mensal", exact: true });
    await open.click();
    const emptyDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar XLSX", exact: true }).click();
    await (await emptyDownload).saveAs(path.join(runtime, "cash-report-empty.xlsx"));
    const emptyBook = new Excel.Workbook(); await emptyBook.xlsx.readFile(path.join(runtime, "cash-report-empty.xlsx"));
    assert.equal(emptyBook.getWorksheet("Lançamentos por situação").getCell("B2").value, 0);
    assert.equal(emptyBook.getWorksheet("Categorias").rowCount, 1);
    await open.click();
    await page.evaluate(() => { window.originalCreateObjectURL = URL.createObjectURL; URL.createObjectURL = () => { throw new Error("forced failure"); }; });
    await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
    await page.getByRole("dialog").getByText("Não foi possível gerar o relatório mensal. Tente novamente.", { exact: true }).waitFor();
    await page.evaluate(() => { URL.createObjectURL = window.originalCreateObjectURL; });
    const retry = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
    await retry;
    await page.goto(url + "/?error");
    await page.getByText("Falha ao carregar", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Exportar relatório mensal", exact: true }).isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log("PASS: empty month, error feedback, retry, load failure disables export, no browser errors.");
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
