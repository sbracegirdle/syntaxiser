const { test } = require('node:test');
const assert = require('node:assert/strict');
const { maskTypeScript, typescriptAdapter } = require('../out/languages/typescript');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const pack = validatePack({ ...require('../packs/typescript.json'), referenceTopics: require('../packs/typescript-reference.json') });
const retriever = new Retriever(pack);
function context(source, extra = {}) {
  const offset = source.indexOf('CURSOR');
  return typescriptAdapter.extract({ text: source.replace('CURSOR', ''), offset, symbols: [], recentEdits: [], ...extra });
}

test('TypeScript catalog covers every topic with distinct overview and example content', () => {
  assert.equal(pack.languageId, 'typescript');
  assert.equal(pack.concepts.length, 26);
  const grouped = pack.referenceGroups.flatMap(group => group.topics);
  assert.equal(grouped.length, pack.concepts.length);
  assert.equal(new Set(grouped).size, pack.concepts.length);
  for (const concept of pack.concepts) {
    const overview = pack.referenceTopics.find(topic => topic.id === concept.id);
    assert.ok(overview?.syntax && overview.rules.length);
    assert.ok(pack.cards.some(card => card.topics.includes(concept.id)));
    assert.ok(pack.cards.every(card => card.code !== overview.syntax));
  }
  const manifest = require('../package.json');
  for (const id of ['typescript', 'typescriptreact']) assert.ok(manifest.activationEvents.includes(`onLanguage:${id}`));
});

test('TypeScript scanner masks comments, escaped strings, templates and regex literals', () => {
  const text = '// function fake() {\n/* class Fake { */\nconst a = "escaped \\" {";\nconst b = \'{\';\nconst c = `hello ${name} {\n}`;\nconst regex = /[{}\\/]+/g;\n';
  const masked = maskTypeScript(text);
  assert.equal(masked.length, text.length);
  assert.equal(masked.split('\n').length, text.split('\n').length);
  assert.ok(!masked.includes('{'));
  assert.equal(context(text + 'CURSOR').scope, 'module');
  assert.match(maskTypeScript('const ratio = total / count;'), /total \/ count/);
  for (const text of ['/* unterminated {', '"unterminated {', '`unterminated {']) assert.ok(!maskTypeScript(text).includes('{'));
});

test('TypeScript fallback tracks functions, arrows, class methods and type bodies', () => {
  for (const source of [
    'function greet(name: string): string { CURSORreturn name; }',
    'async function load(\n id: string,\n): Promise<string> { CURSORreturn id; }',
    'const run = (n: number) => { if (n > 0) { CURSORreturn n; } };',
    'class Counter { value = 0; increment(): number { CURSORreturn ++this.value; } }',
    'class User { constructor(name: string) { CURSOR } }',
  ]) assert.equal(context(source).scope, 'function', source);
  for (const source of ['interface User { CURSORname: string }', 'type User = { CURSORname: string };', 'class User { CURSORname = "Ada"; }']) {
    assert.equal(context(source).scope, 'type', source);
  }
  assert.equal(context('function work() {}\nCURSOR').scope, 'module');
  assert.equal(context('const fn = (n: number) => CURSORn + 1;', { symbols: [{ name: 'fn', kind: 12, start: 0, end: 100 }] }).scope, 'function');
  assert.equal(context('function work() {\n const counts = new CURSORMap<string, number>();\n}').focus, 'Map');
});

test('TypeScript import extraction retains module paths and ignores fake or dynamic imports', () => {
  const source = '// import { fake } from "fake";\nconst text = \'import x from "fake-string"\';\nimport "./setup";\nimport type {\n User,\n} from "./models";\nimport * as utils from "./utils";\nconst pending = import("./lazy");\nCURSOR';
  const result = context(source);
  for (const path of ['./setup', './models', './utils']) assert.ok(result.imports.includes(path), path);
  for (const path of ['fake', 'fake-string', './lazy']) assert.ok(!result.imports.includes(path), path);
});

test('TypeScript searches and cursor context retrieve the requested concepts', () => {
  const searches = { 'key value lookup': 'maps', 'handle missing value': 'optional', 'type guard': 'narrowing', 'generic': 'generics', 'transform collection': 'arrays', 'partial update': 'utility', 'async await': 'async', 'as const': 'satisfies', 'try catch': 'errors' };
  for (const [query, topic] of Object.entries(searches)) {
    assert.ok(retriever.search(query, 2).some(hit => hit.card.topics.includes(topic)), query);
    assert.ok(retriever.searchTopics(query, 2).includes(topic), `overview: ${query}`);
  }
  for (const [line, topic] of [['new Map<string, number>()', 'maps'], ['await load()', 'async'], ['profile?.name ?? "Anonymous"', 'optional']]) {
    const result = context(`function work() {\n CURSOR${line};\n}`);
    assert.ok(retriever.relevant(result, 3).some(hit => hit.card.topics.includes(topic)), line);
    assert.ok(retriever.relevantTopics(result, 2).includes(topic), `overview: ${line}`);
  }
});
