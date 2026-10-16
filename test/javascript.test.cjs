const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const { javascriptAdapter } = require('../out/languages/javascript');
const { typescriptAdapter } = require('../out/languages/typescript');
const { scanEcmaScript } = require('../out/languages/ecmascript');
const load = id => validatePack({ ...require(`../packs/${id}.json`), referenceTopics: require(`../packs/${id}-reference.json`) });
function context(adapter, text) {
  const offset = text.indexOf('CURSOR');
  return adapter.extract({ text: text.replace('CURSOR', ''), offset, symbols: [], recentEdits: [] });
}
const pack = load('javascript');
const depthQueries = [
  ['bind callback','this-binding'], ['lazy generator','generators'], ['regex capture','regex'],
  ['json parse error','json'], ['promise all settled','promise-combinators'],
  ['form submit validation','browser-forms'], ['weakmap cache','weakmap'],
  ['unicode grapheme count','unicode'], ['node file url','node-paths'],
  ['react reducer','react-reducer'], ['react context','react-context'],
  ['react accessible form','react-form'], ['express malformed json','express-validation'],
  ['vitest fake timer','vitest-async'],
];
test('JavaScript depth tasks remain concrete in the first three search results', () => {
  const retriever = new Retriever(pack);
  for (const [query, topic] of depthQueries) {
    assert.ok(retriever.search(query,3).some(hit=>hit.card.topics.includes(topic)), query);
    assert.ok(retriever.searchTopics(query,3).includes(topic), 'overview: '+query);
  }
});
test('depth context recognizes receivers, protocols, aliased APIs, scopes and incomplete edits', () => {
  const retriever = new Retriever(pack);
  for (const [source, topic, scope] of [
    ['function listen() {\n const callback = method.CURSORbind(receiver);\n}', 'this-binding','function'],
    ['function* read() {\n CURSORyield record;\n}', 'generators','function'],
    ['function read(text) {\n return text.CURSORmatchAll(pattern);\n}', 'regex','function'],
    ['function cache() {\n const metadata = new CURSORWeakMap();\n}', 'weakmap','function'],
    ['import { fileURLToPath as decodePath } from "node:url";\nfunction path() {\n return CURSORdecodePath(import.meta.url);\n}', 'node-paths','function'],
    ['import { useReducer as reduce } from "react";\nfunction View() {\n const [state, dispatch] = CURSORreduce(reducer, initial);\n}', 'react-reducer','function'],
    ['function submit(form) {\n const fields = new CURSORFormData(form);\n}', 'browser-forms','function'],
    ['function work(jobs) {\n return Promise.CURSORallSettled(jobs);\n}', 'promise-combinators','function'],
    ['function work() {\n CURSORqueueMicrotask(', 'event-loop','function'],
    ['class Worker {\n run() {\n this.CURSORhandle.bind(this);\n }\n}', 'this-binding','function'],
  ]) {
    const result=context(javascriptAdapter,source);
    assert.equal(result.scope,scope,source);
    assert.ok(retriever.relevant(result,3).some(hit=>hit.card.topics.includes(topic)), `${topic}: ${JSON.stringify(result)}`);
  }
});
test('depth signals ignore comments, strings and misleading names, and retain recent executable edits', () => {
  const retriever = new Retriever(pack);
  for(const prefix of ['// new WeakMap(); method.bind(receiver);', 'const note = "new WeakMap() method.bind(receiver)";', 'const WeakMapHelper = 1; const bindCallbackDocument = 2;']) {
    const ctx=context(javascriptAdapter,prefix+'\nfunction work() {\n CURSORreturn 1;\n}');
    assert.ok(!retriever.relevant(ctx,3).some(hit=>hit.card.topics.includes('weakmap') || hit.card.topics.includes('this-binding')),prefix);
  }
  const input={text:'function work() {\n return 1;\n}',offset:20,symbols:[],recentEdits:['const cache = new WeakMap();']};
  const ctx=javascriptAdapter.extract(input);
  assert.match(ctx.recentEdits,/WeakMap/);
  assert.ok(retriever.relevant(ctx,5).some(hit=>hit.card.topics.includes('weakmap')));
  input.recentEdits=['// new WeakMap()'];
  assert.ok(!javascriptAdapter.extract(input).recentEdits.includes('WeakMap'));
  const promise=context(javascriptAdapter,'function work() {\n return Promise.CURSORresolve(1);\n}');
  assert.ok(!retriever.relevant(promise,3).some(hit=>hit.card.topics.includes('node-paths')), 'Promise.resolve is not a Node path API');
});
test('each new depth unit has separate overview and two useful variants with actual evidence registrations',()=>{
  const profile=require('../coverage/languages.json').languages.javascript;
  const groups=['objects','data','concurrency','browser','node'];
  const topics=new Set(pack.referenceGroups.filter(g=>groups.includes(g.id)).flatMap(g=>g.topics));
  for(const id of ['functions','this-binding','react-reducer','react-context','react-form','express-validation','vitest-async']) topics.add(id);
  assert.equal(topics.size,25);
  for(const topic of topics) {
    const cards=pack.cards.filter(card=>card.topics.includes(topic));
    assert.ok(cards.length>=2,topic);
    assert.equal(new Set(cards.map(card=>card.code)).size,cards.length,topic);
    for(const situation of ['happy','edge','error']) assert.ok(profile.evidence.some(e=>e.kind==='behavior'&&e.cases.includes(situation)&&cards.some(c=>c.id===e.card)),`${topic}/${situation}`);
    assert.ok([...profile.requiredTopics,...profile.ecosystemTopics].includes(topic),topic);
  }
});
test('JavaScript catalog has separate grouped overviews, unique identities, valid JSX and no typed AST nodes', () => {
  assert.equal(pack.cards.length, 80);
  assert.equal(new Set(pack.referenceGroups.flatMap(group => group.topics)).size, pack.concepts.length);
  for (const concept of pack.concepts) {
    const overview = pack.referenceTopics.find(topic => topic.id === concept.id);
    assert.ok(overview.references.length);
    assert.ok(pack.cards.some(card => card.topics.includes(concept.id)));
    assert.ok(pack.cards.every(card => card.code !== overview.syntax));
  }
  const forbidden = new Set([ts.SyntaxKind.InterfaceDeclaration, ts.SyntaxKind.TypeAliasDeclaration, ts.SyntaxKind.AsExpression, ts.SyntaxKind.TypeAssertionExpression, ts.SyntaxKind.EnumDeclaration, ts.SyntaxKind.SatisfiesExpression, ts.SyntaxKind.NonNullExpression]);
  for (const card of pack.cards) {
    const source = ts.createSourceFile(`${card.id}.jsx`, card.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
    assert.deepEqual(source.parseDiagnostics, [], card.id);
    function visit(node) {
      assert.ok(!forbidden.has(node.kind) && !node.type && !node.typeParameters && !node.typeArguments, `${card.id}: typed syntax`);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  for (const id of ['javascript', 'javascriptreact', 'typescript', 'typescriptreact']) assert.ok(require('../package.json').activationEvents.includes(`onLanguage:${id}`));
});
for (const [language, adapter] of [['javascript', javascriptAdapter], ['typescript', typescriptAdapter]]) {
  const retriever = new Retriever(load(language));
  test(`${language}: task searches prioritize focused recipes and independently ranked overviews`, () => {
    for (const [query, topic] of [['react props','react-props'], ['click handler','react-events'], ['effect cleanup','react-effect'], ['fetch cancel','fetch-cancel'], ['read file node','node-files'], ['express error middleware','express-errors'], ['react keys','react-list'], ['focus input','react-ref'], ['testing library','testing-library']]) {
      assert.ok(retriever.search(query, 3).some(hit => hit.card.topics[0] === topic), query);
      assert.ok(retriever.searchTopics(query, 2).includes(topic), `overview: ${query}`);
    }
  });
  test(`${language}: context handles aliased imports, JSX expressions, fragments and incomplete edits`, () => {
    for (const [source, topic] of [
      ['import { useEffect as observe } from "react";\nconst View = () => { CURSORobserve(() => () => {}, []); return <div />; };', 'react-effect'],
      ['const View = () => <><section><button CURSORonClick={() => save()}>Save</button></section></>;', 'react-events'],
      ['const View = () => <ul>{tasks.map(task => <li CURSORkey={task.id}>{task.name}</li>)}</ul>;', 'react-list'],
      ['const View = () => <><div><Widget CURSORchildren={<span />} /></div></>;', 'react-props'],
      ['const View = () => <button CURSORonClick={', 'react-events'],
      ['import { readFile as read } from "node:fs/promises";\nasync function work() { await CURSORread(path, "utf8"); }','node-files'],
      ['function work() { return `prefix ${CURSORfetch(url)}`; }','fetch-cancel'],
    ]) {
      const result = context(adapter, source);
      assert.equal(result.languageId, language);
      assert.ok(retriever.relevant(result, 5).some(hit => hit.card.topics[0] === topic), `${topic}: ${source}`);
      assert.ok(retriever.relevantTopics(result, 3).includes(topic), `overview ${topic}: ${JSON.stringify(result)}`);
    }
  });
}
test('lexical context masks JSX text, quoted attributes, comments, regex and template text while retaining expressions', () => {
  const text = 'const View = () => <div title="useEffect { 🐈">function fake() &#123; /* literal */ {`text ${fetch(url)}`}</div>; // useState\n';
  const result = scanEcmaScript(text);
  assert.equal(result.masked.length, text.length);
  assert.equal(result.masked.split('\n').length, text.split('\n').length);
  assert.ok(!result.masked.includes('fake'));
  assert.ok(!result.masked.includes('useEffect'));
  assert.ok(result.masked.includes('fetch(url)'));
  assert.equal(context(javascriptAdapter, text + 'CURSOR').scope, 'module');
  for (const text of ['/* <Fake> {', '"<Fake> {', '`<Fake> {', 'const matcher = /[{}]+/g;']) assert.equal(scanEcmaScript(text).jsx.length, 0);
  assert.equal(context(javascriptAdapter, 'const View = () => { return <div>class Fake &#123;</div>; };\nCURSOR').scope, 'module');
  assert.match(scanEcmaScript('const identity = <T>(value: T) => value;').masked, /value: T/);
  assert.doesNotThrow(() => scanEcmaScript('const View = () => ' + '<div>'.repeat(1000) + '</div>'.repeat(1000)));
  assert.doesNotThrow(() => scanEcmaScript('`x${'.repeat(1000)));
});
