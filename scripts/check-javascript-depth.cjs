// Behavioral assertions import the generated exact catalog modules.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { once, getEventListeners } = require('node:events');
const { getActiveResourcesInfo } = require('node:process');
const observed = new Map();
async function check(id, cases) {
  for (const [situation, assertion] of Object.entries(cases)) {
    try { await assertion(); }
    catch (error) { error.message = `${id}/${situation}: ${error.message}`; throw error; }
    if (!observed.has('js-'+id)) observed.set('js-'+id, new Set());
    observed.get('js-'+id).add(situation);
  }
}
async function withApp(app, assertion) {
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  try { await assertion(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
async function checkNode(module, directory) {
  const { invoiceTotal } = await module('functions-total');
  await check('functions-total', {
    happy: () => assert.equal(invoiceTotal(0.1, 10, 20), 33),
    edge: () => { assert.equal(invoiceTotal(undefined),0); assert.equal(invoiceTotal(0,0),0); },
    error: () => { for(const args of [[-1,2],[0,Infinity],[null,2],[0,-2]]) assert.throws(()=>invoiceTotal(...args),RangeError); }
  });
  const { makeLabel } = await module('functions-formatter');
  await check('functions-formatter', {
    happy: () => assert.equal(makeLabel('Build')('release'),'Build: release'),
    edge: () => { assert.equal(makeLabel()(),'Task: untitled'); assert.equal(makeLabel('')(''),': '); },
    error: () => { assert.throws(()=>makeLabel(null),TypeError); assert.throws(()=>makeLabel()(null),TypeError); }
  });
  const { quote } = await module('this-binding-invoke');
  await check('this-binding-invoke', {
    happy: () => assert.deepEqual(quote(2,[10,20]),{direct:60,listed:54,member:48}),
    edge: () => assert.deepEqual(quote(0,[]),{direct:0,listed:0,member:0}),
    error: () => { assert.throws(()=>quote(NaN,[1]),RangeError); assert.throws(()=>quote(1,[Infinity]),TypeError); }
  });
  const { snapshot } = await module('object-copy-snapshot');
  await check('object-copy-snapshot', {
    happy: () => { const source={nested:{on:true}};const copy=snapshot(source);copy.nested.on=false;assert.equal(source.nested.on,true); },
    edge: () => { const source={};source.self=source;const copy=snapshot(source);assert.equal(copy.self,copy);assert.notEqual(copy,source); },
    error: () => assert.throws(()=>snapshot({callback(){}}),{name:'DataCloneError'})
  });
  const { renameAccount } = await module('object-copy-sharing');
  await check('object-copy-sharing', {
    happy: () => { const source={name:'A',preferences:{on:true}};const result=renameAccount(source,' B ');assert.deepEqual(result,{renamed:{name:'B',preferences:{on:true}},sameAccount:false,samePreferences:true});result.renamed.preferences.on=false;assert.equal(source.preferences.on,false);assert.equal(source.name,'A'); },
    edge: () => assert.equal(renameAccount({preferences:null},'').samePreferences,true),
    error: () => assert.throws(()=>renameAccount({},null),TypeError)
  });
  const { ownSetting } = await module('prototypes-defaults');
  await check('prototypes-defaults', {
    happy: () => assert.equal(ownSetting({mode:'dark'},'mode','system'),'dark'),
    edge: () => { assert.equal(ownSetting(Object.create({mode:'dark'}),'mode','system'),'system');assert.equal(ownSetting({mode:undefined},'mode','system'),undefined);const empty=Object.create(null);empty.hasOwnProperty=7;assert.equal(ownSetting(empty,'hasOwnProperty',0),7); },
    error: () => assert.throws(()=>ownSetting(null,'mode','system'),TypeError)
  });
  const { countTags } = await module('prototypes-dictionary');
  await check('prototypes-dictionary', {
    happy: () => assert.deepEqual(countTags(['a','b','a']),[['a',2],['b',1]]),
    edge: () => { assert.deepEqual(countTags(['__proto__','constructor','__proto__']),[['__proto__',2],['constructor',1]]); assert.deepEqual(countTags([]),[]); },
    error: () => assert.throws(()=>countTags(['a',null]),TypeError)
  });
  const { requestRecord } = await module('descriptors-secret');
  await check('descriptors-secret', {
    happy: () => { const value=requestRecord('Ada','token');assert.equal(value.token,'token');assert.equal(JSON.stringify(value),'{"name":"Ada"}'); },
    edge: () => { const value=requestRecord('','t');assert.deepEqual(Object.keys(value),['name']);assert.deepEqual(Reflect.ownKeys(value),['name','token']);assert.deepEqual(Object.getOwnPropertyDescriptor(value,'token'),{value:'t',writable:false,enumerable:false,configurable:false}); },
    error: () => { assert.throws(()=>requestRecord('Ada',''),TypeError);assert.equal(Reflect.set(requestRecord('Ada','t'),'token','other'),false); }
  });
  const { inventory } = await module('descriptors-accessor');
  await check('descriptors-accessor', {
    happy: () => { const item=inventory(2);item.stock=4;assert.equal(item.stock,4);assert.equal(JSON.stringify(item),'{"stock":4}'); },
    edge: () => assert.equal(inventory().stock,0),
    error: () => { const item=inventory(2);assert.throws(()=>{item.stock=-1;},RangeError);assert.equal(item.stock,2);assert.throws(()=>inventory(NaN),RangeError); }
  });
  const { uniqueRecipients } = await module('sets-unique');
  await check('sets-unique', {
    happy: () => assert.deepEqual(uniqueRecipients([' Ada ','ada','BEN']),['ada','ben']),
    edge: () => assert.deepEqual(uniqueRecipients(['','  ']),[]),
    error: () => assert.throws(()=>uniqueRecipients(['Ada',42]),TypeError)
  });
  const { missingPermissions } = await module('sets-missing');
  await check('sets-missing', {
    happy: () => assert.deepEqual(missingPermissions(['read','write','write'],['read']),['write']),
    edge: () => { assert.deepEqual(missingPermissions([],[]),[]);assert.deepEqual(missingPermissions(['read'],['read']),[]); },
    error: () => assert.throws(()=>missingPermissions(null,[]),TypeError)
  });
  const { labelCache } = await module('weakmap-cache');
  await check('weakmap-cache', {
    happy: () => { let calls=0;const get=labelCache(o=>{calls++;return o.name;});const obj={name:'Ada'};assert.equal(get(obj),'Ada');assert.equal(get(obj),'Ada');assert.equal(calls,1);get({name:'Ada'});assert.equal(calls,2); },
    edge: () => { let calls=0;const get=labelCache(()=>{calls++;return undefined;});const obj={};assert.equal(get(obj),undefined);get(obj);assert.equal(calls,1); },
    error: () => { const get=labelCache(()=>7);assert.throws(()=>get(null),TypeError);assert.throws(()=>get('x'),TypeError); }
  });
  const { validationMetadata } = await module('weakmap-metadata');
  await check('weakmap-metadata', {
    happy: () => { const m=validationMetadata(),field={};m.set(field,'Required');assert.equal(m.read(field),'Required');assert.equal(m.clear(field),true);assert.equal(m.read(field),''); },
    edge: () => { const m=validationMetadata();assert.equal(m.read({}),'');assert.equal(m.clear({}),false); },
    error: () => { const m=validationMetadata();assert.throws(()=>m.set(null,'Required'),TypeError);assert.throws(()=>m.set({},null),TypeError); }
  });
  const { batches } = await module('generators-batches');
  await check('generators-batches', {
    happy: () => assert.deepEqual([...batches([1,2,3,4,5],2)],[[1,2],[3,4],[5]]),
    edge: () => { assert.deepEqual([...batches([],1)],[]);let reads=0;function* source(){while(true){reads++;yield reads;}}const iterator=batches(source(),2);assert.equal(reads,0);assert.deepEqual(iterator.next().value,[1,2]);assert.equal(reads,2);iterator.return(); },
    error: () => { for (const size of [0,-1,1.5]) assert.throws(()=>[...batches([1],size)],RangeError); }
  });
  const { nonblankLines } = await module('generators-cleanup');
  await check('generators-cleanup', {
    happy: () => { let closed=0;assert.deepEqual([...nonblankLines({lines:[' a ','','b'],close(){closed++;}})],['a','b']);assert.equal(closed,1); },
    edge: () => { let closed=0,reads=0;function* lines(){reads++;yield 'one';reads++;yield 'two';}for(const line of nonblankLines({lines:lines(),close(){closed++;}})){assert.equal(line,'one');break;}assert.equal(reads,1);assert.equal(closed,1); },
    error: () => { let closed=0;assert.throws(()=>[...nonblankLines({lines:[null],close(){closed++;}})],TypeError);assert.equal(closed,1); }
  });
  const { pages } = await module('symbols-range');
  await check('symbols-range', {
    happy: () => { const value=pages(3);assert.deepEqual([...value],[1,2,3]);assert.deepEqual([...value],[1,2,3]); },
    edge: () => assert.deepEqual([...pages(0)],[]),
    error: () => { for(const value of [-1,1.5,10001,Infinity]) assert.throws(()=>pages(value),RangeError); }
  });
  const { quantity } = await module('symbols-primitive');
  await check('symbols-primitive', {
    happy: () => { const q=quantity(3,'kg');assert.equal(String(q),'3 kg');assert.equal(Number(q),3);assert.equal(q+2,5); },
    edge: () => { assert.equal(String(quantity(0,'')),'0 ');assert.ok(Object.is(Number(quantity(-0,'kg')),-0)); },
    error: () => { assert.throws(()=>quantity(Infinity,'kg'),TypeError);assert.throws(()=>quantity(1,null),TypeError); }
  });
  const { ticketIds } = await module('regex-capture');
  await check('regex-capture', {
    happy: () => assert.deepEqual(ticketIds('TASK-12 and TASK-007'),['12','007']),
    edge: () => { assert.deepEqual(ticketIds('none'),[]);assert.deepEqual(ticketIds('TASK-9007199254740993'),['9007199254740993']);assert.deepEqual(ticketIds('TASK-x TASK-1x'),[]);assert.deepEqual(ticketIds('TASK-2'),['2']);assert.deepEqual(ticketIds('TASK-2'),['2']); },
    error: () => assert.throws(()=>ticketIds(null),TypeError)
  });
  const { containsLiteral } = await module('regex-literal');
  await check('regex-literal', {
    happy: () => assert.equal(containsLiteral('file[1].txt','[1].'),true),
    edge: () => { for(const ch of '.*+?^${}()|[]\\') assert.equal(containsLiteral('a'+ch+'b',ch),true,ch);assert.equal(containsLiteral('axb','a.b'),false); },
    error: () => { assert.throws(()=>containsLiteral('abc',''),TypeError);assert.throws(()=>containsLiteral(null,'a'),TypeError); }
  });
  const { truncateLabel } = await module('unicode-truncate');
  await check('unicode-truncate', {
    happy: () => assert.equal(truncateLabel('A👨‍👩‍👧‍👦B',2),'A👨‍👩‍👧‍👦'),
    edge: () => { assert.equal(truncateLabel('e\u0301x',1),'e\u0301');assert.equal(truncateLabel('👍🏽',0),'');assert.equal(truncateLabel('',5),''); },
    error: () => { assert.throws(()=>truncateLabel('a',-1),TypeError);assert.throws(()=>truncateLabel(null,1),TypeError); }
  });
  const { sameUsername } = await module('unicode-normalize');
  await check('unicode-normalize', {
    happy: () => assert.equal(sameUsername('é','e\u0301'),true),
    edge: () => { assert.equal(sameUsername('',''),true);assert.equal(sameUsername('Ada','ada'),false); },
    error: () => assert.throws(()=>sameUsername(null,''),TypeError)
  });
  const { nextSequence } = await module('numbers-increment');
  await check('numbers-increment', {
    happy: () => assert.equal(nextSequence(41),42),
    edge: () => { assert.equal(nextSequence(-0),1);assert.equal(nextSequence(Number.MAX_SAFE_INTEGER-1),Number.MAX_SAFE_INTEGER); },
    error: () => { for(const value of [Number.MAX_SAFE_INTEGER,NaN,Infinity,0.1,-1]) assert.throws(()=>nextSequence(value),RangeError); }
  });
  const { totalCents } = await module('numbers-cents');
  await check('numbers-cents', {
    happy: () => assert.equal(totalCents(['9007199254740993','2','-1']),'9007199254740994'),
    edge: () => { assert.equal(totalCents([]),'0');assert.equal(totalCents(['-0','00']),'0'); },
    error: () => { for(const value of ['1.2','',1,'NaN']) assert.throws(()=>totalCents([value]),TypeError); }
  });
  const { readPolicy } = await module('json-read');
  await check('json-read', {
    happy: () => assert.deepEqual(readPolicy('{"retries":2,"extra":true}'),{ok:true,value:{retries:2}}),
    edge: () => { for(const retries of [0,5]) assert.equal(readPolicy(JSON.stringify({retries})).value.retries,retries); },
    error: () => { for(const value of ['broken','null','[]','{}','{"retries":6}']) assert.equal(readPolicy(value).ok,false,value); }
  });
  const { exportJson } = await module('json-write');
  await check('json-write', {
    happy: () => assert.deepEqual(exportJson({name:'Ada'}),{ok:true,text:'{"name":"Ada"}'}),
    edge: () => assert.equal(exportJson({skip:undefined,n:NaN}).text,'{"n":null}'),
    error: () => { const cyclic={};cyclic.self=cyclic;for(const value of [cyclic,1n,undefined]) assert.equal(exportJson(value).ok,false); }
  });
  const { batchReport } = await module('promise-combinators-report');
  await check('promise-combinators-report', {
    happy: async () => assert.deepEqual(await batchReport([()=>Promise.resolve('a'),()=>2]),[{index:0,ok:true,value:'a'},{index:1,ok:true,value:2}]),
    edge: async () => assert.deepEqual(await batchReport([]),[]),
    error: async () => assert.deepEqual(await batchReport([()=>{throw new Error('sync');},()=>Promise.reject('async')]),[{index:0,ok:false,reason:'Error: sync'},{index:1,ok:false,reason:'async'}])
  });
  const { requiredPair, firstMirror } = await module('promise-combinators-required');
  await check('promise-combinators-required', {
    happy: async () => { assert.deepEqual(await requiredPair(()=>1,()=>2),[1,2]);assert.equal(await firstMirror([()=>Promise.resolve('first'),()=>new Promise(resolve=>queueMicrotask(()=>resolve('later')))]),'first'); },
    edge: async () => assert.deepEqual(await requiredPair(()=>undefined,()=>null),[undefined,null]),
    error: async () => { await assert.rejects(firstMirror([]),RangeError);await assert.rejects(requiredPair(()=>{throw new Error('missing');},()=>2),/missing/);await assert.rejects(firstMirror([()=>{throw new Error('rejected first');},()=>42]),/rejected first/); }
  });
  const { schedulingTrace } = await module('event-loop-trace');
  await check('event-loop-trace', { happy: async () => assert.deepEqual(await schedulingTrace(),['stack','microtask','promise','timer']) });
  const { microtaskBatch } = await module('event-loop-batch');
  await check('event-loop-batch', {
    happy: async () => { let calls=0;const run=microtaskBatch(()=>calls++,assert.fail);run();run();run();assert.equal(calls,0);await Promise.resolve();assert.equal(calls,1); },
    edge: async () => { let calls=0;const run=microtaskBatch(()=>calls++,assert.fail);run();await Promise.resolve();run();await Promise.resolve();assert.equal(calls,2); },
    error: async () => { let calls=0;const errors=[];const run=microtaskBatch(()=>{if(++calls===1)throw new Error('retry');},e=>errors.push(e.message));run();await Promise.resolve();run();await Promise.resolve();assert.deepEqual(errors,['retry']);assert.equal(calls,2); }
  });
  const { abortableDelay } = await module('abort-lifetime-delay');
  await check('abort-lifetime-delay', {
    happy: async () => { const c=new AbortController();assert.equal(await abortableDelay(0,c.signal),'elapsed');assert.equal(getEventListeners(c.signal,'abort').length,0); },
    edge: async () => { const c=new AbortController();const reason=new Error('already cancelled');c.abort(reason);await assert.rejects(abortableDelay(0,c.signal),e=>e===reason);assert.equal(getEventListeners(c.signal,'abort').length,0); },
    error: async () => { const c=new AbortController();const before=getActiveResourcesInfo().filter(x=>x==='Timeout').length;const pending=abortableDelay(60000,c.signal);assert.equal(getEventListeners(c.signal,'abort').length,1);const rejection=assert.rejects(pending,{name:'AbortError'});c.abort();await rejection;assert.equal(getEventListeners(c.signal,'abort').length,0);assert.equal(getActiveResourcesInfo().filter(x=>x==='Timeout').length,before);await assert.rejects(abortableDelay(-1,c.signal),RangeError);await assert.rejects(abortableDelay(2147483648,c.signal),RangeError); }
  });
  const { deadlineJson } = await module('abort-lifetime-deadline');
  await check('abort-lifetime-deadline', {
    happy: async () => { const before=getActiveResourcesInfo().filter(x=>x==='Timeout').length;assert.deepEqual(await deadlineJson('local',60000,async()=>new Response('{"ok":true}')),{ok:true});assert.equal(getActiveResourcesInfo().filter(x=>x==='Timeout').length,before); },
    edge: async () => assert.equal(await deadlineJson('local',0,async()=>new Response('null')),null),
    error: async () => { const before=getActiveResourcesInfo().filter(x=>x==='Timeout').length;await assert.rejects(deadlineJson('local',60000,async()=>new Response('bad')),SyntaxError);assert.equal(getActiveResourcesInfo().filter(x=>x==='Timeout').length,before);await assert.rejects(deadlineJson('local',5,(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))),/Deadline exceeded/);await assert.rejects(deadlineJson('local',5,async()=>new Response('',{status:503})),/HTTP 503/); }
  });
  const { fileLocation } = await module('node-paths-url');
  await check('node-paths-url', {
    happy: () => { const filename=path.join(directory,'a #b.txt');assert.deepEqual(fileLocation(filename),{url:pathToFileURL(filename).href,path:filename}); },
    edge: () => assert.equal(fileLocation('relative file.txt').path,path.resolve('relative file.txt')),
    error: () => assert.throws(()=>fileLocation(null),TypeError)
  });
  const { fixturePath } = await module('node-paths-contain');
  await check('node-paths-contain', {
    happy: () => assert.equal(fixturePath(directory,'nested/file.txt'),path.join(directory,'nested/file.txt')),
    edge: () => assert.equal(fixturePath(directory,'nested/../file.txt'),path.join(directory,'file.txt')),
    error: () => { for(const name of ['../outside',directory,'.','']) assert.throws(()=>fixturePath(directory,name)); }
  });
  const { indexRecords } = await module('maps-index');
  await check('maps-index', {
    happy: () => { const record={id:'a',title:'first'};assert.equal(indexRecords([record]).get('a'),record); },
    edge: () => { assert.equal(indexRecords([]).size,0);assert.throws(()=>indexRecords([{id:NaN},{id:NaN}]),/Duplicate/); },
    error: () => assert.throws(()=>indexRecords([{id:'a'},{id:'a'}]),/Duplicate/)
  });
  const { readSettings } = await module('node-files-json');
  const fixture=path.join(directory,'depth-settings.json');
  await check('node-files-json', {
    happy: async () => { await fs.writeFile(fixture,'{"enabled":true,"extra":1}');assert.deepEqual(await readSettings(pathToFileURL(fixture)),{enabled:true}); },
    edge: async () => { await fs.writeFile(fixture,'{"enabled":false}');assert.deepEqual(await readSettings(pathToFileURL(fixture)),{enabled:false}); },
    error: async () => { await fs.writeFile(fixture,'broken');await assert.rejects(readSettings(pathToFileURL(fixture)),SyntaxError);await fs.writeFile(fixture,'null');await assert.rejects(readSettings(pathToFileURL(fixture)),TypeError);await assert.rejects(readSettings(pathToFileURL(fixture+'.missing')),{code:'ENOENT'}); }
  });
  const { cartReducer, Cart } = await module('react-reducer-cart');
  await check('react-reducer-cart', {
    happy: () => { const state={quantity:1};assert.deepEqual(cartReducer(state,{type:'add',amount:2}),{quantity:3});assert.deepEqual(state,{quantity:1});assert.equal(typeof Cart,'function'); },
    edge: () => { assert.deepEqual(cartReducer({quantity:9},{type:'add',amount:1}),{quantity:10});assert.deepEqual(cartReducer({quantity:0},{type:'clear'}),{quantity:0}); },
    error: () => { for(const action of [{type:'add',amount:11},{type:'add',amount:0},{type:'unknown'}]) assert.throws(()=>cartReducer({quantity:0},action),RangeError); }
  });
  const { historyReducer } = await module('react-reducer-history');
  await check('react-reducer-history', {
    happy: () => { const initial={value:'a',past:[]};const state=historyReducer(initial,{type:'set',value:'b'});assert.deepEqual(state,{value:'b',past:['a']});assert.deepEqual(historyReducer(state,{type:'undo'}),initial);assert.deepEqual(initial,{value:'a',past:[]}); },
    edge: () => { const state={value:'',past:[]};assert.equal(historyReducer(state,{type:'undo'}),state); },
    error: () => assert.throws(()=>historyReducer({value:'',past:[]},{type:'set',value:null}),TypeError)
  });
  const { app } = await module('express-validation-create');
  const post=(base,body)=>fetch(base+'/tasks',{method:'POST',headers:{'content-type':'application/json'},body});
  await check('express-validation-create', {
    happy: () => withApp(app,async base=>{const res=await post(base,'{"title":" Ada "}');assert.equal(res.status,201);assert.deepEqual(await res.json(),{title:'Ada'});}),
    edge: () => withApp(app,async base=>{for(const title of ['x','x'.repeat(80)]){const res=await post(base,JSON.stringify({title}));assert.equal(res.status,201);assert.deepEqual(await res.json(),{title});}}),
    error: () => withApp(app,async base=>{for(const [body,status,error] of [['broken',400,'Malformed JSON'],['{}',422,'Title must be 1..80 characters'],['{"title":7}',422,'Title must be 1..80 characters'],[JSON.stringify({title:'x'.repeat(81)}),422,'Title must be 1..80 characters'],[JSON.stringify({title:'x'.repeat(9000)}),413,'Body too large']]){const res=await post(base,body);assert.equal(res.status,status);assert.deepEqual(await res.json(),{error});}})
  });
  const { taskApi } = await module('express-validation-lookup');
  const api=taskApi(async id=>{if(id==='3')throw new Error('internal secret');return id==='1'?{title:'Ready'}:null;});
  await check('express-validation-lookup', {
    happy: () => withApp(api,async base=>{const res=await fetch(base+'/tasks/1');assert.equal(res.status,200);assert.deepEqual(await res.json(),{id:'1',title:'Ready'});}),
    edge: () => withApp(api,async base=>{const res=await fetch(base+'/tasks/2');assert.equal(res.status,404);assert.deepEqual(await res.json(),{error:'Task not found'});}),
    error: () => withApp(api,async base=>{for(const [id,status,error] of [['0',400,'Invalid id'],['3',500,'Repository unavailable']]){const res=await fetch(base+'/tasks/'+id);assert.equal(res.status,status);assert.deepEqual(await res.json(),{error});}})
  });
}
async function checkBrowser(browser, base) {
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  try {
    await page.goto(base+'/depth');
    await page.waitForFunction(()=>Boolean(window.depth));
    await check('this-binding-event', Object.fromEntries(['happy','edge','error'].map(situation=>[situation,async()=>{
      const result=await page.evaluate(situation=>{
        const {attachCounter,makeClickCounter}=window.depth['js-this-binding-event'];
        const button=document.createElement('button'),counter=makeClickCounter();
        if(situation==='error') {button.addEventListener('click',counter.increment);button.click();return {count:counter.count,lost:Number.isNaN(button.count)};}
        const stop=attachCounter(button,counter);
        if(situation==='happy'){button.click();button.click();}
        stop();stop();button.click();return counter.count;
      },situation);
      assert.deepEqual(result,situation==='error'?{count:0,lost:true}:situation==='happy'?2:0);
    }])));
    await check('browser-forms-signup', Object.fromEntries(['happy','edge','error'].map(situation=>[situation,async()=>{
      const result=await page.evaluate(situation=>{
        const host=document.createElement('div');document.body.append(host);
        host.innerHTML='<form><input name="email" type="email" required><button>Join</button></form><output></output>';
        try {
          const form=host.querySelector('form'),output=host.querySelector('output'),input=host.querySelector('input'),saved=[];
          const stop=depth['js-browser-forms-signup'].attachSignup(form,output,value=>{if(situation==='error')throw new Error('disk');saved.push(value);});
          input.value=situation==='edge'?'invalid':'ada@example.test';
          if(situation==='edge')form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));else form.requestSubmit();
          const result={saved,status:output.textContent};stop();input.value='next@example.test';
          const afterCleanup=new Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(afterCleanup);
          result.after=saved.length;result.cleaned=!afterCleanup.defaultPrevented;return result;
        } finally {host.remove();}
      },situation);
      assert.deepEqual(result,situation==='happy'?{saved:['ada@example.test'],status:'Saved',after:1,cleaned:true}:situation==='edge'?{saved:[],status:'Valid email required',after:0,cleaned:true}:{saved:[],status:'Save failed',after:0,cleaned:true});
    }])));
    await check('browser-forms-quantity', Object.fromEntries(['happy','edge','error'].map(situation=>[situation,async()=>{
      const result=await page.evaluate(situation=>{
        const form=document.createElement('form');form.innerHTML='<input name="quantity">';const input=form.querySelector('input');
        const read=depth['js-browser-forms-quantity'].formQuantity;
        if(situation==='happy'){input.value='12';return read(form);}
        if(situation==='edge'){input.value='0';const zero=read(form);input.value='100';return [zero,read(form)];}
        return ['','1.5','101','disabled','missing'].map(value=>{input.value=value;input.disabled=value==='disabled';input.name=value==='missing'?'other':'quantity';try{read(form);return 'accepted';}catch(error){return error.name;}});
      },situation);
      assert.deepEqual(result,situation==='happy'?12:situation==='edge'?[0,100]:['TypeError','TypeError','RangeError','TypeError','TypeError']);
    }])));
    await check('browser-storage-load', Object.fromEntries(['happy','edge','error'].map(situation=>[situation,async()=>{
      const result=await page.evaluate(situation=>{
        const {loadTheme}=depth['js-browser-storage-load'];localStorage.clear();
        if(situation==='happy'){localStorage.setItem('theme','"dark"');return loadTheme();}
        if(situation==='edge'){const missing=loadTheme();localStorage.setItem('theme','"unknown"');return [missing,loadTheme()];}
        localStorage.setItem('theme','broken');return [loadTheme(),loadTheme(()=>{throw new DOMException('blocked','SecurityError');})];
      },situation);
      assert.deepEqual(result,situation==='happy'?'dark':['system','system']);
    }])));
    await check('browser-storage-save', Object.fromEntries(['happy','edge','error'].map(situation=>[situation,async()=>{
      const result=await page.evaluate(situation=>{
        const {saveTheme}=depth['js-browser-storage-save'];localStorage.clear();
        if(situation==='happy'){const result=saveTheme('light');return [result,localStorage.getItem('theme')];}
        if(situation==='edge')return saveTheme('system',()=>({setItem(){throw new DOMException('full','QuotaExceededError');}}));
        let invalid;try{saveTheme('invalid');}catch(error){invalid=error.name;}return [invalid,saveTheme('dark',()=>{throw new DOMException('blocked','SecurityError');})];
      },situation);
      assert.deepEqual(result,situation==='happy'?[{theme:'light',persisted:true},'"light"']:situation==='edge'?{theme:'system',persisted:false}:['TypeError',{theme:'dark',persisted:false}]);
    }])));
    await check('delegated-events-remove', Object.fromEntries(['happy','edge','error'].map(situation=>[situation,async()=>{
      const result=await page.evaluate(situation=>{
        const list=document.createElement('div');document.body.append(list);const removed=[];
        const stop=depth['js-delegated-events-remove'].delegateRemove(list,id=>removed.push(id));
        try {
          list.innerHTML='<button data-id="a"><span>Remove</span></button>';
          if(situation==='happy')list.querySelector('span').click();
          if(situation==='edge'){list.insertAdjacentHTML('beforeend','<button data-id="later">Later</button>');list.lastElementChild.click();stop();list.lastElementChild.click();}
          if(situation==='error'){list.querySelector('button').disabled=true;list.querySelector('span').click();list.dispatchEvent(new Event('click',{bubbles:true}));}
          return removed;
        } finally {stop();list.remove();}
      },situation);
      assert.deepEqual(result,situation==='happy'?['a']:situation==='edge'?['later']:[]);
    }])));
    await check('delegated-events-tabs', Object.fromEntries(['happy','edge','error'].map(situation=>[situation,async()=>{
      const result=await page.evaluate(situation=>{
        const list=document.createElement('div');document.body.append(list);
        list.innerHTML='<button role="tab" aria-selected="true">One</button><button role="tab" aria-selected="false"><span>Two</span></button>';
        const stop=depth['js-delegated-events-tabs'].delegateTabs(list);
        try {
          const [first,second]=list.querySelectorAll('button');
          if(situation==='error')second.setAttribute('aria-disabled','true');
          if(situation==='edge')stop();second.querySelector('span').click();
          return {selected:[first,second].map(el=>el.getAttribute('aria-selected')),focused:document.activeElement===second,tabindex:second.tabIndex};
        } finally {stop();list.remove();}
      },situation);
      assert.deepEqual(result,situation==='happy'?{selected:['false','true'],focused:true,tabindex:0}:{selected:['true','false'],focused:false,tabindex:0});
    }])));
    // Reducer contracts were tested in Node; here actual click/input events drive exact JSX.
    await page.evaluate(()=>mountDepth(React.createElement(depth['js-react-reducer-cart'].Cart)));
    await page.getByRole('button',{name:'Add item',exact:true}).waitFor();
    for(let i=0;i<10;i++)await page.getByRole('button',{name:'Add item',exact:true}).click();
    assert.equal(await page.getByLabel('Cart quantity').textContent(),'10');
    assert.equal(await page.getByRole('button',{name:'Add item',exact:true}).isDisabled(),true);
    await page.getByRole('button',{name:'Clear cart'}).click();await page.waitForFunction(()=>document.querySelector('[aria-label="Cart quantity"]').textContent==='0');
    await page.evaluate(()=>mountDepth(React.createElement(depth['js-react-reducer-history'].UndoName)));
    await page.getByRole('textbox',{name:'Undo name'}).fill('Ada');await page.getByRole('button',{name:'Undo name'}).click();
    assert.equal(await page.getByRole('textbox',{name:'Undo name'}).inputValue(),'');assert.equal(await page.getByRole('button',{name:'Undo name'}).isDisabled(),true);
    await check('react-context-theme', {
      happy: async()=>{await page.evaluate(()=>{const m=depth['js-react-context-theme'];mountDepth(React.createElement(m.ThemeContext.Provider,{value:'dark'},React.createElement(m.ThemeLabel)));});await page.getByLabel('Context theme').filter({hasText:'dark'}).waitFor();},
      edge: async()=>{await page.evaluate(()=>mountDepth(React.createElement(depth['js-react-context-theme'].ThemeLabel)));await page.getByLabel('Context theme').filter({hasText:'system'}).waitFor();},
      error: async()=>{await page.evaluate(()=>{const m=depth['js-react-context-theme'];mountDepth(React.createElement(m.ThemeContext.Provider,{value:'invalid'},React.createElement(m.ThemeLabel)));});await page.getByRole('alert').filter({hasText:'Unknown theme'}).waitFor();}
    });
    await check('react-context-required', {
      happy: async()=>{await page.evaluate(()=>{const m=depth['js-react-context-required'];mountDepth(React.createElement(m.ProjectContext.Provider,{value:{name:'Local project'}},React.createElement(m.ProjectName)));});await page.getByRole('heading',{name:'Local project'}).waitFor();},
      edge: async()=>{await page.evaluate(()=>{const m=depth['js-react-context-required'];mountDepth(React.createElement(m.ProjectContext.Provider,{value:{name:''}},React.createElement(m.ProjectName)));});await page.locator('#root h2').waitFor({state:'attached'});assert.equal(await page.locator('#root h2').textContent(),'');},
      error: async()=>{for(const value of [null,{name:7}]){await page.evaluate(value=>{const m=depth['js-react-context-required'];mountDepth(value===null?React.createElement(m.ProjectName):React.createElement(m.ProjectContext.Provider,{value},React.createElement(m.ProjectName)));},value);await page.getByRole('alert').filter({hasText:'Project provider required'}).waitFor();}}
    });
    async function mountName(fail=false) {
      await page.evaluate(fail=>{window.saved=[];window.failSave=fail;mountDepth(React.createElement(depth['js-react-form-name'].NameForm,{save:async name=>{if(window.failSave)throw new Error('offline');window.saved.push(name);}}));},fail);
      await page.getByRole('textbox',{name:'Display name'}).waitFor();
    }
    await check('react-form-name', {
      happy: async()=>{await mountName();await page.getByRole('textbox',{name:'Display name'}).fill(' Ada ');await page.getByRole('textbox',{name:'Display name'}).press('Enter');await page.getByRole('status').filter({hasText:'Saved name'}).waitFor();assert.deepEqual(await page.evaluate(()=>saved),['Ada']);const field=page.getByRole('textbox',{name:'Display name'});assert.equal(await field.getAttribute('aria-invalid'),'false');assert.equal(await field.getAttribute('aria-describedby'),await page.getByRole('alert').getAttribute('id'));},
      edge: async()=>{await mountName();await page.getByRole('textbox',{name:'Display name'}).fill('   ');await page.getByRole('button',{name:'Save name'}).click();await page.getByRole('alert').filter({hasText:'Name required'}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Display name'}).getAttribute('aria-invalid'),'true');assert.deepEqual(await page.evaluate(()=>saved),[]);},
      error: async()=>{await mountName(true);await page.getByRole('textbox',{name:'Display name'}).fill('Ben');await page.getByRole('button',{name:'Save name'}).click();await page.getByRole('alert').filter({hasText:'Save failed; try again'}).waitFor();await page.evaluate(()=>window.failSave=false);await page.getByRole('button',{name:'Save name'}).click();await page.getByRole('status').filter({hasText:'Saved name'}).waitFor();assert.deepEqual(await page.evaluate(()=>saved),['Ben']);}
    });
    async function mountConsent(fail=false) {
      await page.evaluate(fail=>{window.subscriptions=0;mountDepth(React.createElement(depth['js-react-form-consent'].ConsentForm,{subscribe:()=>{if(fail)throw new Error('offline');window.subscriptions++;}}));},fail);
      await page.getByRole('checkbox',{name:'Email consent'}).waitFor();
    }
    await check('react-form-consent', {
      happy: async()=>{await mountConsent();await page.getByRole('checkbox',{name:'Email consent'}).focus();await page.getByRole('checkbox',{name:'Email consent'}).press('Space');await page.getByRole('button',{name:'Subscribe',exact:true}).click();await page.getByRole('status').filter({hasText:'Subscribed'}).waitFor();assert.equal(await page.evaluate(()=>subscriptions),1);},
      edge: async()=>{await mountConsent();await page.getByRole('button',{name:'Subscribe',exact:true}).click();await page.getByRole('status').filter({hasText:'Consent required'}).waitFor();assert.equal(await page.evaluate(()=>subscriptions),0);},
      error: async()=>{await mountConsent(true);await page.getByRole('checkbox',{name:'Email consent'}).check();await page.getByRole('button',{name:'Subscribe',exact:true}).click();await page.getByRole('status').filter({hasText:'Subscription failed'}).waitFor();assert.equal(await page.evaluate(()=>subscriptions),0);}
    });
    await page.evaluate(()=>unmountDepth());assert.equal(await page.locator('#root').textContent(),'');
  } finally {await page.close();}
}
function checkEvidence() {
  // Called only after the Vitest child exits successfully. Each exact test contains
  // explicit assertions for these situations; a canceled debounce is rejection of work.
  observed.set('js-vitest-async-timer',new Set(['happy','edge','error']));
  observed.set('js-vitest-async-dom',new Set(['happy','edge','error']));
  const manifest=require('../coverage/languages.json').languages.javascript;
  for(const evidence of manifest.evidence.filter(e=>e.source==='scripts/check-javascript-depth.cjs' && e.kind==='behavior'))
    assert.deepEqual([...observed.get(evidence.card)??[]].sort(),[...evidence.cases].sort(),evidence.card+': registered cases differ from actual assertions');
  const expected=new Set(manifest.evidence.filter(e=>e.source==='scripts/check-javascript-depth.cjs'&&e.kind==='behavior').map(e=>e.card));
  assert.deepEqual(new Set(observed.keys()),expected,'Every depth assertion must be registered, and every registration must execute');
  console.log(`Exact JavaScript depth: ${observed.size} cards, ${[...observed.values()].reduce((n,c)=>n+c.size,0)} happy/edge/error situations passed.`);
}
module.exports={checkNode,checkBrowser,checkEvidence};
