// Isolated UI review: real screens, simulated service boundaries; no production writes.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
let source = fs.readFileSync(path.join(__dirname, 'dashboard.browser.cjs'), 'utf8');
// Development React reports invalid DOM props; production suppresses these warnings.
source = source.replace('production', 'development');
source = source.replace('const errors = [];', `const errors = [];
    page.on('console', message => {
      if (message.type() === 'error' && /transform-origin/.test(message.text())) errors.push(message.text());
    });`);
source = source.replace('global: "globalThis"', 'global: "globalThis", "process.env": "{}"');
source = source.replace('filter: /\\/lib\\/supabase$/', 'filter: /(?:\\/lib\\/supabase|^\\.\\/supabase)$/');
source = source.replace("import Dashboard from './app/(tabs)/(home)/homeScreen';", `
import Dashboard from './app/(tabs)/(home)/homeScreen';
import Orders from './app/(tabs)/(order)/orders';
import AddOrder from './app/(tabs)/(order)/addOrder';
import Cash from './app/(tabs)/cashFlow';
import Clients from './app/(tabs)/(client)/addClients';
import Supplier from './app/(tabs)/(supplier)/addSupplier';
import Material from './app/(tabs)/(material)/addMaterial';
import SignIn from './app/(auth)/signIn';
import { LoginTransitionProvider } from './src/components/LoginTransitionProvider';
const mode=new URLSearchParams(location.search).get('screen');
const Screen=({orders:Orders,addOrder:AddOrder,cash:Cash,clients:Clients,supplier:Supplier,material:Material,login:SignIn})[mode]||Dashboard;`);
source = source.replace('<Dashboard/>', '<LoginTransitionProvider><Screen/></LoginTransitionProvider>');
source = source.replace("id:i+1,id_cliente", "id:i+1,total_cents:(22+i*3)*10000,id_cliente");
source = source.replace("export const usePathname=()=>'/homeScreen'; export const router={replace(){}};", "export const usePathname=()=>new URLSearchParams(location.search).get('screen')==='orders'?'/orders':'/homeScreen'; export const router={replace(){},push(route){window.lastRoute=route}};");
source = source.replace('export const cashError=e=>e.message;', 'export const cashError=e=>e.message;export async function deleteCashEntry(){};export async function saveCashEntries(){};');
source = source.replace("id:'in'+i,type", "description:'Venda',category:'Vendas',id:'in'+i,type").replace("id:'out'+i,type", "description:'Compra',category:'Materiais',id:'out'+i,type").replace("id:'pending-in',type", "description:'Recebimento',category:'Vendas',id:'pending-in',type").replace("id:'pending-out',type", "description:'Pagamento',category:'Materiais',id:'pending-out',type");
source = source.replaceAll("description:'", "notes:'',description:'");
source = source.replace('export const supabase={from(table){const query={select(){return query},is(){return query},then(resolve){', `export const supabase={auth:{getUser:async()=>({data:{user:{id:'fixture'}}}),signInWithPassword:async()=>({data:{session:null},error:{message:'Invalid login credentials'}})},rpc:async()=>({data:99,error:null}),from(table){const query={select(){return query},is(){return query},eq(){return query},gt(){return query},gte(){return query},order(){return query},limit(){return query},range(){return query},single(){return query},maybeSingle(){return query},then(resolve){`);
source=source.replace("import React from 'react';export function Ionicons", "import React from 'react';export function Ionicons");
// Link is needed by the actual login screen.
source=source.replace("if (args.path === \"router\") contents = `import", "if (args.path === \"router\") contents = `export const Link=({children})=>children;import");
// Replace the dashboard-only review with viewport and flow checks for the redesign.
const start=source.indexOf('    for (const width of [320');
const end=source.indexOf('  } finally',start);
source=source.slice(0,start)+`
    for(const width of [1366,390]) {
      await page.setViewportSize({width,height:768});
      for(const screen of ['orders','addOrder','cash','clients','supplier','material','login','dashboard']) {
        await page.goto('http://127.0.0.1:'+server.address().port+'/?screen='+screen);
        await page.waitForTimeout(1800);
        await page.evaluate(()=>document.fonts.ready);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,screen+' page overflow at '+width);
        if(errors.length) throw new Error(JSON.stringify(errors));
        if(screen==='orders'){
          const action=page.getByText('Novo pedido',{exact:true});
          assert.ok(await action.isVisible());
          const box=await page.getByTestId('orders-filters').boundingBox();
          assert.ok(box.y+box.height<768,'filters below fold');
          if(width===390) await page.getByText('Status e período',{exact:true}).click();
          await page.getByText('Pendente',{exact:true}).first().click();
          await page.getByLabel('Identificador',{exact:true}).fill('1');
          await page.getByText('Pesquisar',{exact:true}).click();
          await page.getByText('Limpar filtros',{exact:true}).click();
          assert.equal(await page.getByLabel('Identificador',{exact:true}).inputValue(),'');
          await action.click();assert.ok((await page.evaluate(()=>window.lastRoute)).includes('addOrder'));
        }
        if(screen==='login'){
          await page.getByPlaceholder('voce@exemplo.com').fill('teste@exemplo.com');
          await page.getByPlaceholder('Digite sua senha').fill('senha-incorreta');
          await page.getByText('Entrar no Sistema',{exact:true}).click();
          await page.getByText('Credenciais inválidas.',{exact:true}).waitFor();
        }
        if(screen==='cash'){
          await page.getByRole('button',{name:'Mês anterior',exact:true}).click();
          await page.getByRole('button',{name:'Próximo mês',exact:true}).click();
          await page.getByLabel('Buscar movimentações').fill('inexistente');
          await page.getByText('Nenhuma movimentação encontrada',{exact:true}).waitFor();
          await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
        }
        await page.screenshot({path:path.join(runtime,'redesign-'+screen+'-'+width+'.png'),fullPage:true});
        console.log(screen+' reviewed at '+width+' x 768');
      }
    }
    assert.deepEqual(errors,[]);
`+source.slice(end);
const mod = new Module(__filename, module);
mod.filename = __filename;mod.paths=module.paths;
mod._compile(source,__filename);
