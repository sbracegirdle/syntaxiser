const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const { rustAdapter } = require('../out/languages/rust');
const pack = validatePack({ ...require('../packs/rust.json'), referenceTopics: require('../packs/rust-reference.json') });
const retriever = new Retriever(pack);
const cases = require('./fixtures/rust-libraries/cases.json');
const ids = results => results.map(result => result.card.id);
function context(source) {
  const offset = source.indexOf('|');
  return rustAdapter.extract({ text: source.replace('|', ''), offset, recentEdits: [], symbols: [] });
}

test('Rust audit recipes are covered by exact-code Cargo fixtures and separate overviews', () => {
  assert.equal(new Set(cases.map(entry => entry.id)).size, cases.length);
  for (const entry of cases) {
    const card = pack.cards.find(card => card.id === entry.id);
    assert.ok(card, entry.id);
    assert.ok(card.explanation?.trim(), entry.id);
    assert.ok(card.code.split('\n').length <= 20, entry.id);
    for (const id of card.topics) {
      const overview = pack.referenceTopics.find(topic => topic.id === id);
      assert.ok(overview, id);
      assert.notEqual(overview.syntax, card.code, id);
      assert.ok(pack.referenceGroups.some(group => group.topics.includes(id)), id);
    }
    assert.equal(card.languageId, entry.kind === 'manifest' ? 'toml' : undefined);
  }
  for (const concept of pack.concepts.slice(83)) {
    assert.ok(cases.some(entry => pack.cards.find(card => card.id === entry.id).topics.includes(concept.id)), concept.id);
  }
});

test('audit searches return concrete library and fundamentals examples', () => {
  for (const [query, expected] of [
    ['thiserror', 'thiserror-derived'], ['anyhow', 'anyhow-context'],
    ['clap', 'clap-parser'], ['rand', 'rand-range-shuffle'], ['regex', 'regex-captures'],
    ['tracing', 'tracing-setup'], ['log crate', 'log-setup'],
    ['serde json round trip', 'serde-roundtrip'], ['tokio channel', 'tokio-mpsc'],
    ['tokio::sync::mpsc', 'tokio-mpsc'], ['implement Iterator', 'implement-iterator'],
    ['IntoIterator', 'implement-intoiterator'], ['Pin Unpin', 'pin-future-poll'],
    ['spawn process', 'spawn-process-output'], ['read directory', 'read-directory'],
    ['itertools tuple windows', 'itertools-windows-join'], ['toml config', 'toml-config'],
    ['indexmap', 'indexmap-order'], ['bytesmut', 'bytes-freeze'], ['uuid', 'uuid-create-parse'],
    ['chrono RFC3339', 'chrono-rfc3339'], ['tempfile', 'tempfile-lifetime'],
    ['derive macro syn quote', 'derive-macro-named'], ['cargo workspace', 'cargo-workspace'],
  ]) {
    const results = ids(retriever.search(query));
    assert.ok(results.slice(0, 3).includes(expected), query + ': ' + results);
  }
  for (const query of ['tokio channel', 'tokio::sync::mpsc']) {
    const results = ids(retriever.search(query, 20));
    assert.ok(results.indexOf('tokio-mpsc') < results.indexOf('bounded-channel') || !results.includes('bounded-channel'), query);
  }
});

test('new libraries and traits respond to cursor and imported API context', () => {
  for (const [source, expected] of [
    ['fn run() {\n let pair = tokio::sync::mpsc::channel|::<String>(8);\n}', 'tokio-mpsc'],
    ['use tokio::{sync::{mpsc as jobs, oneshot}};\nfn run() {\n let pair = jobs::channel|::<String>(8);\n}', 'tokio-mpsc'],
    ['use tokio::sync::mpsc;\nfn run() {\n let pair = mpsc::channel|::<String>(8);\n}', 'tokio-mpsc'],
    ['use regex::Regex;\nfn run() {\n let re = Regex::new|(pattern);\n}', 'regex-captures'],
    ['use rand::Rng;\nfn run() {\n let n = rng.random_range|(1..=6);\n}', 'rand-range-shuffle'],
    ['fn run() {\n let value = serde_json::from_str|(text);\n}', 'serde-roundtrip'],
    ['#[derive(thiserror::Error|, Debug)]\nenum Failure { }', 'thiserror-derived'],
    ['use std::sync::mpsc;\nfn run() {\n let pair = mpsc::channel|::<String>();\n}', 'channel-send'],
    ['fn run() {\n let job = tokio::spawn|(async { 42 });\n}', 'tokio-task-join'],
    ['fn run() {\n tracing::info!|(answer = 42);\n}', 'tracing-setup'],
    ['impl Iterator for Countdown {\n type Item = u8;\n |\n}', 'implement-iterator'],
  ]) {
    const results = ids(retriever.relevant(context(source), 12));
    assert.ok(results.includes(expected), source + ': ' + results);
    if (expected === 'tokio-mpsc') for (const blocking of ['bounded-channel', 'channel-send']) {
      assert.ok(!results.includes(blocking) || results.indexOf(expected) < results.indexOf(blocking), source + ': ' + results);
    }
  }
  const imported = context('use tokio::sync::mpsc;\nfn run() {\n\n\n\n\n |\n}');
  const results = ids(retriever.relevant(imported, 20));
  assert.ok(results.includes('tokio-mpsc'), results);
  assert.ok(!results.includes('bounded-channel') || results.indexOf('tokio-mpsc') < results.indexOf('bounded-channel'), results);
});

test('Cargo highlighting override is validated without changing Rust pin identity', () => {
  const card = pack.cards.find(card => card.id === 'cargo-workspace');
  assert.equal(pack.languageId, 'rust');
  assert.doesNotThrow(() => validatePack({ ...pack, cards: [card] }));
  for (const languageId of [null, 42, 'javascript', '']) {
    assert.throws(() => validatePack({ ...pack, cards: [{ ...card, languageId }] }), /Invalid reference card/);
  }
});
