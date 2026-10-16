const { test } = require('node:test');
const assert = require('node:assert/strict');
const { typescriptAdapter } = require('../out/languages/typescript');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const pack = validatePack({ ...require('../packs/typescript.json'), referenceTopics: require('../packs/typescript-reference.json') });
const retriever = new Retriever(pack);
const ids = require('../playground/typescript/libraries/depth-cards.json');
const expected = { 'conditional infer': 'conditional', 'exhaustive never': 'exhaustive', 'readonly tuple': 'readonly', 'promise all settled': 'promises', 'react reducer': 'react-reducer', 'zod errors': 'zod', 'key remapping': 'mapped', 'generic constraint': 'variance', 'context cleanup': 'react-context' };
function context(source, recentEdits = []) {
 const offset = source.indexOf('|');
 return typescriptAdapter.extract({ text: source.replace('|', ''), offset, symbols: [], recentEdits });
}
test('TypeScript depth task searches reach concrete examples and independent overviews', () => {
 for (const [query, topic] of Object.entries(expected)) {
  assert.ok(retriever.search(query, 3).some(hit => hit.card.topics.includes(topic)), query);
  assert.ok(retriever.searchTopics(query, 3).includes(topic), 'overview: ' + query);
 }
 for (const topic of pack.concepts.slice(51)) {
  assert.ok(pack.cards.filter(card => card.topics.includes(topic.id)).length >= 2, topic.id);
  const overview = pack.referenceTopics.find(item => item.id === topic.id);
  assert.ok(overview.rules.some(rule => /5\.9\.3/.test(rule)), topic.id);
 }
 assert.equal(new Set(ids).size, 28);
});
test('depth cursor examples handle imports, aliases, scopes and incomplete edits', () => {
 for (const [source, topic, scope] of [
  ['type Result<T> = T extends { value: |infer V } ? V : never;', 'conditional', 'module'],
  ['function f() { const bounds: |readonly [number, number] = [0, 1]; }', 'readonly', 'function'],
  ['async function f() { await |Promise.allSettled(tasks); }', 'promises', 'function'],
  ['import { useReducer as reduce } from "react";\nfunction Form() { const state = |reduce(reducer, initial); }', 'react-reducer', 'function'],
  ['import { useContext as consume } from "react";\nfunction View() { return |consume(Theme); }', 'react-context', 'function'],
  ['function f() { |assertNever(', 'exhaustive', 'function'],
  ['interface Input { bounds: |readonly [number, number]; }', 'readonly', 'type'],
 ]) {
  const ctx = context(source);
  assert.equal(ctx.scope, scope, source);
  assert.ok(retriever.relevant(ctx, 3).some(hit => hit.card.topics.includes(topic)), topic + ': ' + retriever.relevant(ctx, 3).map(h => h.card.id));
 }
});
test('depth cues ignore comments, literal text and misleading identifiers; real recent edits survive', () => {
 for (const source of ['// infer useReducer Promise.allSettled\n|', 'const text = "assertNever readonly useReducer";\n|', 'const useReducerLabel = "x";\n|']) {
  const ctx = context(source);
  assert.ok(!retriever.relevantTopics(ctx).some(t => ['conditional', 'react-reducer', 'exhaustive', 'promises'].includes(t)), source);
 }
 const ctx = context('function f() {\n |\n}', ['// useReducer fake', 'await Promise.allSettled(tasks)']);
 assert.ok(!ctx.recentEdits.includes('useReducer')); assert.match(ctx.recentEdits, /Promise\.allSettled/);
 assert.ok(retriever.relevant(ctx, 12).some(hit => hit.card.topics.includes('promises')));
});
test('generated behavioral modules remain byte-equivalent to the actual catalog', () => {
 const fs = require('node:fs');
 require('node:child_process').execFileSync(process.execPath, [require.resolve('../playground/typescript/libraries/prepare-depth.cjs')]);
 for (const id of ids) {
  const actual = fs.readFileSync(require('node:path').join(__dirname, '../playground/typescript/libraries/.catalog-depth', id + '.tsx'), 'utf8');
  assert.equal(actual, 'export {};\n' + pack.cards.find(card => card.id === id).code + '\n', id);
 }
});
