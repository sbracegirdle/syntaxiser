const {test} = require('node:test');
const assert = require('node:assert/strict');
const {validatePack} = require('../out/core/pack');
const {Retriever} = require('../out/core/retrieval');
const {csharpAdapter, maskCsharp} = require('../out/languages/csharp');
const pack = validatePack({...require('../packs/csharp.json'),referenceTopics:require('../packs/csharp-reference.json')});
const retriever = new Retriever(pack);
const extract = (source,symbols=[]) => csharpAdapter.extract({text:source.replace('CURSOR',''),offset:source.indexOf('CURSOR'),symbols,recentEdits:[]});
test('C# topics have independently authored overviews, practical cards, groups and official references',()=>{
  assert.equal(pack.languageId,'csharp');
  assert.equal(pack.cards.length,112);
  assert.deepEqual(new Set(pack.concepts.map(c=>c.id)),new Set(pack.referenceTopics.map(t=>t.id)));
  assert.deepEqual(new Set(pack.concepts.map(c=>c.id)),new Set(pack.referenceGroups.flatMap(g=>g.topics)));
  for(const topic of pack.referenceTopics){
    assert.ok(topic.references.length);
    const cards=pack.cards.filter(c=>c.topics.includes(topic.id));
    assert.ok(cards.length >= 2, topic.id);
    assert.ok(cards.every(c=>c.code!==topic.syntax));
  }
  assert.ok(require('../package.json').activationEvents.includes('onLanguage:csharp'));
});
for(const [query,id] of [
  ['nullable value','nullable'],['linq group','linq'],['async cancellation','async'],['dispose resource','resources'],
  ['json deserialize','json'],['minimal api','minimal-api'],['xunit theory','xunit-theory'],
  ['async dispose','async-dispose'],['file io','files'],['http client','http'],['api request tests','api-tests'],
  ['minimal api validation','api-validation'],['xunit async assertions','xunit-async'],
]) test('C# search: '+query,()=>{
  assert.equal(retriever.search(query,3)[0].card.topics[0],id);
  assert.ok(retriever.searchTopics(query).includes(id));
});
for(const [source,id] of [
  ['using System.Text.Json;\nclass Demo { void Run() { CURSORJsonSerializer.Deserialize<Order>(json); } }','json'],
  ['using Json = System.Text.Json.JsonSerializer;\nclass Demo { void Run() { CURSORJson.Deserialize<Order>(json); } }','json'],
  ['using System.Linq;\nclass Demo { void Run() { orders.CURSORGroupBy(o => o.Name); } }','linq'],
  ['using Xunit;\nclass Tests { [CURSORTheory] public void Test() {} }','xunit-theory'],
  ['using Microsoft.AspNetCore.Builder;\nclass Demo { void Run() { app.CURSORMapGet("/", () => 1); } }','minimal-api'],
  ['class Demo { async Task Run() { await CURSORTask.Delay(1, token); } }','async'],
  ['class Demo { async Task Run() { await using var lease = CURSORnew Lease(); } }','async-dispose'],
  ['class Demo { void Run() { using var reader = new CURSORStreamReader(path); } }','resources'],
]) test('C# cursor/import cue: '+id,()=>{
  const context=extract(source);
  assert.ok(retriever.relevant(context,3).some(r=>r.card.topics.includes(id)));
  assert.ok(retriever.relevantTopics(context,4).includes(id));
});
test('C# handles namespaces, type bodies, constructors, accessors, methods, lambdas and incomplete edits',()=>{
  for(const [source,scope] of [
    ['CURSORusing System;', 'module'],['namespace App { CURSORclass Demo {} }','module'],
    ['namespace App; class Demo { CURSORint field; }','type'],['record struct Point(int X) { CURSORint Y; }','type'],
    ['interface IWork { CURSORvoid Run(); }','type'],['enum Mode { CURSOROn }','type'],
    ['class Demo { Demo() { CURSORint n = 1; } }','function'],
    ['class Demo { async Task<int> Run(\n CancellationToken token\n) { if(true) { CURSORreturn 1; } } }','function'],
    ['class Demo { int Value { get { CURSORreturn 1; } } }','function'],
    ['class Demo { Action work = () => { CURSORreturn; }; }','function'],
    ['class Demo { void Run() {} CURSORint field; }','type'],['class Demo {}\nCURSOR','module'],
    ['class Demo { void Run() { CURSOR','function'],
  ]) assert.equal(extract(source).scope,scope,source);
  assert.equal(extract('CURSORvalue',[{name:'Run',kind:5,start:0,end:100}]).scope,'function');
  assert.equal(extract('CURSORvalue',[{name:'Demo',kind:4,start:0,end:100}]).scope,'type');
});
test('C# masks literal bodies, escapes, comments, raw and verbatim strings without moving offsets',()=>{
  const source=`// using Xunit;\n/* class Fake { JsonSerializer } */\nvar a = "Theory \\" x";\nvar b = @"line\n""Quoted"" GroupBy";\nvar c = $@"{JsonSerializer.Serialize(1)}";\nvar d = $$"""\n{{Task.Delay(1)}} Theory\n""";\nchar e = '{';\n`;
  const masked=maskCsharp(source);
  assert.equal(masked.length,source.length);
  assert.equal(masked.split('\n').length,source.split('\n').length);
  assert.doesNotMatch(masked,/Xunit|Fake|JsonSerializer|Theory|GroupBy|Task/);
  assert.equal(extract(source+'CURSORvalue = 1;').imports,'');
  assert.doesNotMatch(maskCsharp('var raw = """\nJsonSerializer'),/JsonSerializer/);
  assert.doesNotMatch(maskCsharp('var verbatim = @"\nJsonSerializer'),/JsonSerializer/);
  assert.match(maskCsharp('var unfinished = "Theory\nint real = 1;'),/int real/);
  const context=extract('using System.Text.Json;\nCURSORvalue = 1;');
  assert.equal(context.focus.trim(),'value');
  assert.deepEqual(retriever.relevantTopics(context),[]);
  assert.equal(extract('using System; using Json = System.Text.Json.JsonSerializer;\nCURSORJson.Serialize(value);').imports, 'System\nSystem.Text.Json.JsonSerializer');
  assert.equal(extract('global using Json = global::System.Text.Json.JsonSerializer;\nCURSORJson.Serialize(value);').imports,'global::System.Text.Json.JsonSerializer');
  assert.equal(extract('class Demo { void Run() { using var reader = new StreamReader(path); CURSOR } }').imports,'');
});
test('C# starter path spans all levels and preserves independent task progress',()=>{
  const {LessonStore}=require('../out/core/lessons');
  const languages=[{languageId:'csharp',displayName:'C#'},{languageId:'rust',displayName:'Rust'}];
  const store=new LessonStore(languages);
  const lessons=store.libraries()[0].lessons;
  assert.deepEqual([...new Set(lessons.map(l=>l.difficulty))],[1,2,3,4,5]);
  assert.ok(lessons.every(l=>(l.starter==='' || /^\/\/[^\n]*$/.test(l.starter)) && l.check && l.category));
  store.apply({action:'status',languageId:'csharp',id:'csharp-greeting',status:'done'});
  const restored=new LessonStore(languages,store.serialize());
  assert.equal(restored.libraries()[0].lessons[0].status,'done');
  assert.ok(restored.libraries()[1].lessons.every(l=>l.status==='untracked'));
});

test('C# hides interpolation expressions containing nested strings and nested braces',()=>{
  const source = 'var message = $"{Format("tea")} {JsonSerializer.Serialize(new { Name = "tea" })}";\nvar text = $@"{Format("tea")} {Task.Delay(1)}";\nint actual = 1;';
  const masked = maskCsharp(source);
  assert.equal(masked.length,source.length);
  assert.doesNotMatch(masked,/Format|JsonSerializer|Task|tea/);
  assert.match(masked,/int actual/);
});


for(const [query,topic] of [
 ['checked numeric conversion','numeric'],['using alias','using-directives'],['generic constraint','constraints'],
 ['linq left join','linq-joins'],['async stream cancellation','async-streams'],['http timeout','cancellation'],
 ['options validation','options-validation'],['ef core rollback','ef-transaction'],['xunit fixture','xunit-fixtures'],
 ['ef core projection','ef-query'],['sqlite concurrency token','ef-concurrency'],['json unknown fields','json-contracts'],
 ['event unsubscribe','delegates'],['readonly view snapshot','collection-views'],
]) test('C# depth search finds concrete task in first three: '+query,()=>{
 assert.ok(retriever.search(query,3).some(r=>r.card.topics.includes(topic)),query);
});
for(const [source,topic] of [
 ['using EF = Microsoft.EntityFrameworkCore;\nclass Demo : CURSOREF.DbContext {}','ef-model'],
 ['using Microsoft.EntityFrameworkCore;\nclass Demo { void Run() { db.Items.CURSORAsNoTracking(); } }','ef-query'],
 ['class Demo { async Task Run() { await db.Database.CURSORBeginTransactionAsync(token); } }','ef-transaction'],
 ['class Demo { void Run() { services.CURSORAddOptions<ReportSettings>(); } }','options-validation'],
 ['class Demo { void Run() { config.CURSORGetSection("Report"); } }','options-validation'],
 ['class Demo { async Task Run() { await foreach(var item in source.CURSORWithCancellation(token)) {} } }','async-streams'],
 ['class Demo { void Run() { var writer = CURSORChannel.CreateBounded<int>(2); } }','async-streams'],
 ['using Xunit; class Tests : CURSORIClassFixture<Fixture> {}','xunit-fixtures'],
 ['using Xunit; class Fixture : CURSORIAsyncLifetime {}','xunit-fixtures'],
 ['using Json = System.Text.Json.Serialization.JsonStringEnumConverter<Mode>;\nclass Demo { void Run() { new CURSORJson(); } }','json-contracts'],
 ['class Demo { void Run() { route.CURSORAddEndpointFilter(async (c,n)=>await n(c)); } }','middleware'],
 ['class Demo { void Run() { services.CURSORAddScoped<Session>(); } }','dependency-injection'],
 ['class Demo { void Run() { values.CURSORGroupJoin(','linq-joins'],
]) test('C# depth cursor, aliases and incomplete edits: '+topic,()=>{
 assert.ok(retriever.relevant(extract(source),3).some(r=>r.card.topics.includes(topic)),source);
});
test('C# new API names in comments, literals and misleading identifiers are not cursor cues',()=>{
 const context=extract('using Microsoft.EntityFrameworkCore;\n// AsNoTracking Channel IClassFixture\nvar text = "AddOptions BeginTransactionAsync";\nCURSORchannelLabel = 1;');
 assert.equal(context.focus,'channelLabel');
 assert.deepEqual(retriever.relevantTopics(context),[]);
 const base={text:'value = 1;',offset:0,symbols:[]};
 const current=csharpAdapter.extract({...base,recentEdits:['db.Items.AsNoTracking();']});
 const hidden=csharpAdapter.extract({...base,recentEdits:['// db.Items.AsNoTracking();','"Channel.CreateBounded"']});
 assert.match(current.recentEdits,/AsNoTracking/);
 assert.doesNotMatch(hidden.recentEdits,/AsNoTracking|Channel/);
 assert.ok(retriever.relevant(current,3).some(r=>r.card.topics.includes('ef-query')));
});
test('C# evidence situations match actual independent case names and preserve legacy IDs',()=>{
 const checks=require('../playground/csharp/catalog-checks.json');
 const situations=require('../playground/csharp/situations.json');
 const manifest=require('../coverage/languages.json').languages.csharp;
 for(const card of pack.cards){
  assert.ok(situations[card.id]?.length,card.id);
  if(typeof checks[card.id]==='object')assert.deepEqual(Object.keys(checks[card.id]).sort(),[...situations[card.id]].sort());
  for(const kind of ['parse','typecheck','execute','behavior'])assert.ok(manifest.evidence.some(e=>e.card===card.id&&e.kind===kind));
 }
 for(const topic of pack.concepts)for(const s of ['happy','edge','error'])assert.ok(pack.cards.some(c=>c.topics.includes(topic.id)&&situations[c.id].includes(s)),topic.id+':'+s);
 for(const id of ['types','nullable','control-flow','methods','classes','interfaces','records','generics','collections','patterns','linq','exceptions','async','resources','async-dispose','files','json','http','minimal-api','api-validation','api-errors','api-tests','xunit','xunit-theory','xunit-async'])assert.ok(pack.cards.some(c=>c.id==='csharp-'+id));
});
