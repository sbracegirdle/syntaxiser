const { test } = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { validatePack } = require('../out/core/pack');
const { Retriever, ConceptEncoder } = require('../out/core/retrieval');
const { rustAdapter, maskRust, scopeAt } = require('../out/languages/rust');
const pack = validatePack(require('../packs/rust.json'));
const retriever = new Retriever(pack);
const ids = cards => cards.map(r => r.card.id);
function context(source, edits = [], symbols = []) {
  const offset = source.indexOf('|CURSOR|');
  return rustAdapter.extract({ text: source.replace('|CURSOR|', ''), offset, recentEdits: edits, symbols });
}

test('expanded pack has at least 150 unique, concise code-only cards and known concepts', () => {
  assert.ok(pack.cards.length >= 150);
  assert.equal(new Set(pack.cards.map(c => c.id)).size, pack.cards.length);
  assert.equal(new Set(pack.cards.map(c => c.code)).size, pack.cards.length);
  for (const card of pack.cards) {
    assert.ok(!card.code.includes('//') && !card.code.includes('/*'), card.id);
    assert.ok(card.code.split('\n').length <= 20, card.id);
  }
  assert.throws(() => validatePack({ ...pack, cards: [pack.cards[0], pack.cards[0]] }));
  assert.throws(() => validatePack({ ...pack, cards: [{ ...pack.cards[0], topics: ['unknown'] }] }));
});

test('explanation metadata is optional, validated, and supplied for every Rust snippet', () => {
  for (const card of pack.cards) assert.ok(card.explanation?.trim(), card.id);
  const { explanation, ...legacy } = pack.cards[0];
  assert.doesNotThrow(() => validatePack({ ...pack, cards: [legacy] }));
  assert.doesNotThrow(() => validatePack({ ...pack, cards: [{ ...legacy, explanation: 'An explanation.' }] }));
  for (const invalid of [null, 42, {}, [], '', '   ', '\n']) {
    assert.throws(() => validatePack({ ...pack, cards: [{ ...legacy, explanation: invalid }] }), /Invalid reference card/);
  }
  const withoutExplanations = { ...pack, cards: pack.cards.map(({ explanation, ...card }) => card) };
  const legacyRetriever = new Retriever(withoutExplanations);
  assert.deepEqual(ids(legacyRetriever.search('handle a missing value')), ids(retriever.search('handle a missing value')));
});

test('expanded subjects are reachable by natural phrases and exact operations', () => {
  for (const [query, id] of [
    ['clone on write', 'cow-string'],
    ['read file line by line', 'buffered-read-lines'],
    ['priority queue', 'binaryheap'],
    ['checked arithmetic', 'checked-arithmetic'],
    ['stop on first error', 'iterator-collect-result'],
    ['feature flag', 'cfg-feature'],
    ['const generic array length', 'const-generic-array'],
    ['atomic counter', 'atomic-counter'],
    ['scoped threads', 'thread-scope'],
    ['split text into words', 'string-split'],
    ['implement fromstr', 'fromstr-trait'],
    ['avoid reference cycle', 'weak-upgrade'],
    ['option transpose', 'option-transpose'],
    ['sort_by_key', 'sort-by-key'],
    ['split_at_mut', 'split-at-mut'],
    ['peekable', 'iterator-peekable'],
    ['get_or_insert_with', 'option-insert'],
    ['binary_search', 'binary-search'],
    ['macro_rules repetition', 'macro-repetition'],
  ]) {
    const results = ids(retriever.search(query));
    assert.ok(results.slice(0, 3).includes(id), query + ': ' + results);
  }
});

test('core language forms are reachable through syntax questions', () => {
  for (const [query, id] of require('./fixtures/rust-core.json')) {
    const results = ids(retriever.search(query));
    assert.ok(results.slice(0, 3).includes(id), query + ': ' + results);
  }
  assert.equal(ids(retriever.search('type alias'))[0], 'type-alias');
});

test('core syntax on the cursor line surfaces the corresponding reference', () => {
  for (const [source, id] of [
    ['unsafe fn read(pointer: *const i32) { |CURSOR|}', 'unsafe-function'],
    ['unsafe extern "C" {\n |CURSOR|fn abs(value: i32) -> i32;\n}', 'extern-c'],
    ['union Word {\n |CURSOR|bits: u32,\n}', 'union-fields'],
    ['fn run() {\n let pointer: *mut i32 = &raw mut |CURSOR|value;\n}', 'raw-pointer'],
    ['fn run() {\n let allowed = ready && |CURSOR|!blocked;\n}', 'boolean-operators'],
    ["fn run() {\n 'rows: for row in 0..3 {\n continue |CURSOR|'rows;\n }\n}", 'loop-labels'],
    ['fn run() {\n let result = const { |CURSOR|42 };\n}', 'const-evaluation'],
    ['fn run() {\n let values = input.collect|CURSOR|::<Vec<_>>();\n}', 'turbofish'],
    ['type UserId |CURSOR|= u64;', 'type-alias'],
    ['struct Pair<Element> {\n |CURSOR|first: Element,\n}', 'generic-types'],
  ]) {
    const results = ids(retriever.relevant(context(source)));
    assert.ok(results.includes(id), source + ': ' + results);
  }
});

test('syntax concepts distinguish operators labels identifiers and type parameters', () => {
  const encoder = new ConceptEncoder(pack);
  const score = (source, id) => encoder.encode(source)[pack.concepts.findIndex(c => c.id === id)];
  for (const source of ['let ok = ready || blocked;', 'ready && !blocked']) {
    assert.ok(score(source, 'operators') > 0, source);
    assert.equal(score(source, 'closures'), 0, source);
  }
  for (const source of ['let callback = || 42;', 'values.map(|n| n + 1)', 'move |n| n + 1', 'async move |n| n']) {
    assert.ok(score(source, 'closures') > 0, source);
  }
  for (const source of ["'rows: for row in 0..3 {}", "continue 'rows;", "break 'search 4;"]) {
    assert.equal(score(source, 'lifetimes'), 0, source);
  }
  for (const source of ["&'a str", "fn f<'a>() {}", "&'static str", "T: 'a"]) {
    assert.ok(score(source, 'lifetimes') > 0, source);
  }
  for (const source of ['struct Pair<Element> {}', 'fn wrap<Value>(value: Value) {}', 'impl<Value> Pair<Value> {}']) {
    assert.ok(score(source, 'generics') > 0, source);
  }
  assert.ok(score('let wide: u128 = 0;', 'numbers') > 0);
  assert.ok(score('let signed: i128 = 0;', 'numbers') > 0);
  assert.ok(score('entry.r#type', 'identifiers') > 0);
  assert.equal(score('r#"literal"#', 'identifiers'), 0);
});

test('web server searches surface server and routing alternatives', () => {
  for (const query of ['web server', 'webserver', 'http server', 'web API', 'web service', 'REST API']) {
    const results = retriever.search(query, 12);
    assert.ok(results.length > 5, query);
    const top = ids(results).slice(0, 4);
    assert.ok(top.includes('axum-server'), query + ': ' + top);
    assert.ok(top.includes('actix-server'), query + ': ' + top);
  }
  for (const [query, expected] of [
    ['TCP listener', 'tcp-listener'],
    ['UDP socket', 'udp-socket'],
    ['axum json response', 'axum-json-response'],
    ['actix query parameters', 'actix-path-query'],
    ['shared server state', 'axum-state'],
    ['request middleware', 'axum-middleware'],
    ['http client', 'reqwest-get'],
  ]) assert.ok(ids(retriever.search(query, 12)).includes(expected), query);
  assert.deepEqual(retriever.search('quuxflorp zzzxyz', 60), []);
});

test('semantic queries retrieve concepts without requiring syntax terms', () => {
  for (const [query, topic] of [
    ['handle a missing value', 'option'],
    ['read without moving', 'borrowing'],
    ['change through reference', 'mutable-borrow'],
    ['transform collection', 'iterators'],
    ['propagate error', 'result'],
    ['how long reference lives', 'lifetimes'],
    ['key value lookup table', 'maps'],
    ['shared mutable state', 'interior-mutability'],
    ['one of several variants', 'enums'],
  ]) {
    const results = retriever.search(query);
    assert.ok(results[0].card.topics.includes(topic), `${query}: ${ids(results)}`);
  }
  assert.deepEqual(retriever.search(''), []);
  assert.deepEqual(retriever.search('quuxflorp zzzxyz'), []);
});

test('file scope prioritizes declarations over a function below it', () => {
  const ctx = context('use std::collections::HashMap;\n|CURSOR|\nfn main() {\n let item: Option<i32> = None;\n}');
  assert.equal(ctx.scope, 'module');
  const results = retriever.relevant(ctx);
  assert.ok(ids(results).includes('use'));
  assert.ok(ids(results).includes('fn'));
  assert.ok(results.every(r => r.card.scopes.includes('module')), ids(results));
});

test('cursor syntax outweighs distant imports and old edits', () => {
  const ctx = context('use std::collections::HashMap;\nfn main() {\n let value: Option<i32> = |CURSOR|Some(3);\n}', ['let data = vec![1];']);
  assert.equal(ctx.scope, 'function');
  const results = retriever.relevant(ctx);
  assert.ok(results[0].card.topics.includes('option'), ids(results));
  assert.ok(!ids(results).slice(0, 2).includes('hashmap'));
});

test('iterator and borrowing context surface matching cards', () => {
  const iterator = retriever.relevant(context('fn run() {\n let output = values.iter().filter(|n| **n > 0).|CURSOR|collect::<Vec<_>>();\n}'));
  assert.ok(iterator[0].card.topics.includes('iterators'), ids(iterator));
  const borrowing = retriever.relevant(context('fn update() {\n append(&mut |CURSOR|text);\n}'));
  assert.ok(ids(borrowing).slice(0, 2).includes('borrow-mut'), ids(borrowing));
});

test('recent edits contribute on an otherwise neutral function line', () => {
  const neutral = context('fn run() {\n\n\n\n\n|CURSOR|\n\n\n\n\n}');
  const edited = { ...neutral, recentEdits: 'let optional: Option<i32> = None;' };
  const before = retriever.relevant(neutral, 8).find(r => r.card.id === 'option-match')?.score ?? 0;
  const after = retriever.relevant(edited, 8).find(r => r.card.id === 'option-match')?.score ?? 0;
  assert.ok(after > before);
});

test('scope scanner handles Rust literals, nested comments, lifetimes and nested modules', () => {
  for (const [source, scope] of [
    ['|CURSOR|\nfn main() {}', 'module'],
    ['mod inner {\n|CURSOR|\n}', 'module'],
    ['use std::{collections::{HashMap, |CURSOR|HashSet}};', 'module'],
    ['impl Point {\n|CURSOR|\n}', 'implementation'],
    ['trait Area {\n|CURSOR|\n}', 'trait'],
    ['struct Point {\n x: |CURSOR|i32\n}', 'type'],
    ['fn f() { let s = "} {"; |CURSOR|}', 'function'],
    ['fn f() { let s = br##"} {{"##; |CURSOR|}', 'function'],
    ["fn f<'a>(x: &'a str) { let c = '}'; |CURSOR|}", 'function'],
    ['fn f() { /* } /* } */ } */ |CURSOR|}', 'function'],
    ['fn f() { // }\n|CURSOR|}', 'function'],
    ['fn f() { if true { |CURSOR| } }', 'function'],
  ]) assert.equal(context(source).scope, scope, source);
  const source = "fn f<'a>() { \"Option\"; /* None */ let x = 'x'; }";
  const masked = maskRust(source);
  assert.equal(masked.length, source.length);
  assert.ok(masked.includes("'a"));
  assert.ok(!masked.includes('Option') && !masked.includes('None'));
  assert.equal(scopeAt(masked, masked.length), 'module');
});

test('multiline imports and document symbols are included', () => {
  const source = 'use std::{\n collections::HashMap,\n io::Read,\n};\nfn example() {\n|CURSOR|\n}';
  const ctx = context(source, [], [{ name: 'example', kind: 12, start: 50, end: 1000 }]);
  assert.ok(ctx.imports.includes('HashMap'));
  assert.equal(ctx.symbols, 'example');
  assert.equal(ctx.scope, 'function');
});

test('retrieval is deterministic, returns unique cards and stays lightweight', () => {
  assert.deepEqual(ids(retriever.search('iterator')), ids(retriever.search('iterator')));
  assert.equal(new Set(ids(retriever.search('option'))).size, retriever.search('option').length);
  const ctx = context('fn run() {\n let v = values.iter().|CURSOR|collect::<Vec<_>>();\n}');
  const start = performance.now();
  for (let i = 0; i < 500; i++) retriever.relevant(ctx);
  const average = (performance.now() - start) / 500;
  assert.ok(average < 20, `Average ranking time: ${average}ms`);
});
