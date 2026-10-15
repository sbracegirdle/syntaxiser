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
test('JavaScript catalog has separate grouped overviews, unique identities, valid JSX and no typed AST nodes', () => {
  assert.equal(pack.cards.length, 28);
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
