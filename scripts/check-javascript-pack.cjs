// Explicit compiler/runtime/browser checks of the exact catalog snippets.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const playground = path.join(root, 'playground/javascript');
const { build } = require(path.join(playground, 'node_modules/esbuild'));
const { chromium } = require(path.join(playground, 'node_modules/playwright'));
const { JSDOM } = require(path.join(playground, 'node_modules/jsdom'));
async function main() {
  await (await import(pathToFileURL(path.join(playground, 'build.mjs')))).buildPlayground();
  const directory = path.join(playground, '.catalog');
  const files = (await fs.readdir(directory)).filter(file => /\.(?:jsx|tsx)$/.test(file));
  const typed = files.filter(file => file.endsWith('.tsx')).map(file => path.join(directory, file));
  typed.push(path.join(playground, 'main.ts'), path.join(playground, 'main.tsx'));
  const program = ts.createProgram(typed, {
    strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    skipLibCheck: true, lib: ['lib.es2022.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],
    types: ['node','react'], typeRoots: [path.join(playground, 'node_modules/@types')],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCurrentDirectory: () => directory, getCanonicalFileName: f => f, getNewLine: () => '\n' }));
  // Compile every new JavaScript recipe as JavaScript (JSX transform only).
  for (const file of files.filter(file => file.startsWith('js-'))) await build({entryPoints:[path.join(directory,file)],outfile:path.join(directory,file.replace('.jsx','.mjs')),bundle:true,packages:'external',platform:'node',format:'esm',jsx:'automatic'});
  const module = id => import(pathToFileURL(path.join(directory, `js-${id}.mjs`)));
  const depth = require('./check-javascript-depth.cjs');
  await depth.checkNode(module, directory);
  assert.deepEqual((await module('bindings')).recordVisit(), { name:'Ada', visits:1 });
  const quantity = (await module('equality')).parseQuantity;
  assert.equal(quantity(' 12 '),12); for (const value of ['', '  ', 'x', '-1']) assert.throws(() => quantity(value));
  const original={name:'Grace',visits:1}; assert.deepEqual((await module('objects')).renameProfile(original,' Ada '),{name:'Ada',visits:1});assert.equal(original.name,'Grace');
  assert.deepEqual((await module('destructuring')).taskSummary({id:7}),{title:'Untitled',details:{id:7}});
  const tasks=[{id:'a',name:'First',done:false,category:'open'},{id:'b',name:'Last',done:true,category:'done'}];
  assert.deepEqual((await module('arrays')).activeNames(tasks),['First']);
  assert.deepEqual((await module('control')).selectTasks(tasks,1),[tasks[0]]);
  const makeCounter=(await module('closures')).makeCounter;const a=makeCounter();const b=makeCounter(5);assert.deepEqual([a(),a(),b()],[1,2,6]);
  assert.equal((await module('modules')).slug(' Hello World '),'hello-world');
  assert.equal((await module('optional')).displayName(null),'Anonymous');assert.equal((await module('optional')).displayName({name:''}),'');
  const collected=await (await module('async')).collect([()=>3,()=>Promise.reject('failed'),()=>{throw new Error('sync');}]);assert.deepEqual(collected.values,[3]);assert.equal(collected.failures.length,2);
  assert.deepEqual((await module('errors')).parseSettings('{"theme":"dark"}'),{theme:'dark'});const parseSettings=(await module('errors')).parseSettings; for (const text of ['broken','null','[]']) assert.throws(()=>parseSettings(text), /Invalid settings/);
  assert.equal((await module('templates')).formatTask(tasks[0]),'First: open');
  assert.deepEqual([...(await module('maps')).countCategories(tasks)],[['open',1],['done',1]]);
  const {Wallet}=await module('classes');const wallet=new Wallet();wallet.deposit(3);assert.equal(wallet.balance,3);assert.throws(()=>wallet.deposit(-1));
  const dom=new JSDOM('<button>Click</button><output></output>');
  try { const button=dom.window.document.querySelector('button');const output=dom.window.document.querySelector('output');const stop=(await module('dom-events')).attachClicks(button,output);button.click();button.click();assert.equal(output.textContent,'Clicks: 2');stop();button.click();assert.equal(output.textContent,'Clicks: 2'); } finally {dom.window.close();}
  await fs.writeFile(path.join(directory,'notes.txt'),'First\r\n\nSecond\n');
  const readLines=(await module('node-files')).readLines;assert.deepEqual(await readLines(path.join(directory,'notes.txt')),['First','Second']);await assert.rejects(readLines(path.join(directory,'missing')),{code:'ENOENT'});
  const appModules=[await module('express-route'),await module('express-errors')];
  for (const [i,{app}] of appModules.entries()) {
    const server=app.listen(0,'127.0.0.1');await once(server,'listening');
    try {
      const base=`http://127.0.0.1:${server.address().port}`;
      if (i===0) {
        for (const [body,status] of [[{name:' Ada '},201],[{name:7},400],[{},400]]) {const res=await fetch(base+'/tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});assert.equal(res.status,status);assert.deepEqual(await res.json(),status===201?{name:'Ada'}:{error:'Name required'});}
      } else {const res=await fetch(base+'/failure');assert.equal(res.status,500);assert.deepEqual(await res.json(),{error:'Request failed'});}
    } finally {await new Promise(resolve=>server.close(resolve));}
  }
  const {startServer}=await import(pathToFileURL(path.join(playground,'server.mjs')));
  const server=startServer(0);await once(server,'listening');
  let browser;
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    const {loadJson,startRequest}=await module('fetch-cancel');
    await assert.rejects(loadJson(base+'/fail',new AbortController().signal),/HTTP 503/);
    const request=startRequest(base+'/slow');const rejected=assert.rejects(request.result,{name:'AbortError'});request.cancel();await rejected;
    browser=await chromium.launch({executablePath:process.env.WEB_BROWSER_PATH || undefined});
    console.log(`JavaScript toolchain: Node ${process.version}, Chromium ${browser.version()}, React ${require(path.join(playground,'node_modules/react/package.json')).version}, Express ${require(path.join(playground,'node_modules/express/package.json')).version}, Vitest ${require(path.join(playground,'node_modules/vitest/package.json')).version}`);
    await depth.checkBrowser(browser, base);
    for (const typed of [false,true]) {
      const page=await browser.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(()=>{
        const active=new Set();const add=window.addEventListener;const remove=window.removeEventListener;
        window.addEventListener=function(type,listener,...rest){if(type==='resize')active.add(listener);return add.call(this,type,listener,...rest);};
        window.removeEventListener=function(type,listener,...rest){if(type==='resize')active.delete(listener);return remove.call(this,type,listener,...rest);};
        window.activeResize=()=>active.size;window.aborts=0;const original=window.fetch;
        window.fetch=(url,options)=>{options?.signal?.addEventListener('abort',()=>window.aborts++);return original(url,options);};
      });
      await page.goto(base+(typed?'/?typed':''));
      await page.getByRole('button',{name:'Visits: 0'}).click();await page.getByRole('button',{name:'Visits: 1'}).waitFor();
      await page.getByRole('textbox',{name:'Name',exact:true}).fill('Ada');assert.equal(await page.locator('label output').textContent(),'Ada');
      assert.deepEqual(await page.locator('li').allTextContents(),['Learn JSX','Test cleanup']);
      assert.equal(await page.getByRole('region',{name:'Task panel'}).textContent(),'Task panelNested child');
      await page.getByRole('button',{name:'Focus input'}).click();assert.equal(await page.getByRole('textbox',{name:'Focus target'}).evaluate(el=>el===document.activeElement),true);
      await page.getByLabel('Remote status').filter({hasText:'Ready'}).waitFor();
      await page.setViewportSize({width:777,height:600});await page.waitForFunction(()=>document.querySelector('[aria-label="Window width"]').textContent==='777');
      assert.equal(await page.evaluate(()=>window.activeResize()),1);
      await page.evaluate(typed=>window.renderExamples(typed,'/fail'),typed);await page.waitForFunction(()=>document.querySelector('[aria-label="Remote status"]').textContent.includes('HTTP 503'));
      const before=await page.evaluate(()=>window.aborts);
      await page.evaluate(typed=>window.renderExamples(typed,'/slow'),typed);
      await page.waitForFunction(()=>document.querySelector('[aria-label="Remote status"]').textContent==='Loading');
      await page.evaluate(typed=>window.renderExamples(typed,'/status'),typed);
      await page.waitForFunction(()=>document.querySelector('[aria-label="Remote status"]').textContent==='Ready');
      assert.ok(await page.evaluate(()=>window.aborts)>before,'dependency change aborts prior request');
      await page.evaluate(typed=>window.renderExamples(typed,'/slow'),typed);await page.waitForFunction(()=>document.querySelector('[aria-label="Remote status"]').textContent==='Loading');
      const aborts=await page.evaluate(()=>window.aborts);await page.evaluate(()=>window.unmountExamples());
      await page.waitForFunction(()=>window.activeResize()===0);assert.ok(await page.evaluate(()=>window.aborts)>aborts,'unmount aborts pending request');
      assert.deepEqual(errors,[]);await page.close();
    }
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
  const result=spawnSync(process.execPath,[path.join(playground,'node_modules/vitest/vitest.mjs'),'run'],{cwd:playground,stdio:'inherit'});
  assert.equal(result.status,0,'Exact Vitest/Testing Library snippets');
  depth.checkEvidence();
  console.log(`JavaScript runtime recipes, ${typed.length} strict TS/TSX modules, JSX/TSX browser interactions, request cancellation and effect cleanup passed.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
