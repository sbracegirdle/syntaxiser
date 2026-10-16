const { test } = require('node:test');
const assert = require('node:assert/strict');
const { maskTypeScript, typescriptAdapter } = require('../out/languages/typescript');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const pack = validatePack({ ...require('../packs/typescript.json'), referenceTopics: require('../packs/typescript-reference.json') });
const retriever = new Retriever(pack);
const libraries = require('./fixtures/typescript-libraries.json');
function context(source, extra = {}) {
  const offset = source.indexOf('CURSOR');
  return typescriptAdapter.extract({ text: source.replace('CURSOR', ''), offset, symbols: [], recentEdits: [], ...extra });
}

test('TypeScript catalog covers every topic with distinct overview and example content', () => {
  assert.equal(pack.languageId, 'typescript');
  assert.equal(pack.concepts.length, 47 + libraries.length);
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

test('every supported TypeScript library has reachable examples and its own reference', () => {
  assert.equal(libraries.length, 14);
  for (const library of libraries) {
    assert.ok(pack.referenceTopics.some(topic => topic.id === library.topic));
    for (const id of library.cardIds) assert.ok(pack.cards.some(card => card.id === id && card.topics.includes(library.topic)), id);
    for (const query of library.queries) {
      assert.ok(retriever.search(query, 3).some(hit => hit.card.topics.includes(library.topic)), query);
      assert.ok(retriever.searchTopics(query, 2).includes(library.topic), `overview: ${query}`);
    }
  }
});

test('TypeScript library context follows named, aliased, default, and namespace imports', () => {
  for (const [source, topic] of [
    ['import { useState as useValue } from "react";\nfunction View() { const [value] = CURSORuseValue(0); }', 'react'],
    ['import * as helpers from "lodash";\nfunction work() { CURSORhelpers.groupBy([], item => item); }', 'lodash'],
    ['import client from "axios";\nasync function work() { await CURSORclient.get("/users"); }', 'axios'],
    ['import { expect as check } from "vitest";\nfunction work() { CURSORcheck(1).toBe(1); }', 'vitest'],
    ['import { computed as derive, signal } from "@angular/core";\nfunction work() { const total = CURSORderive(() => 3); }', 'angular'],
    ['import { useQuery as load } from "@tanstack/react-query";\nfunction View() { CURSORload({ queryKey: ["todos"], queryFn: async () => [] }); }', 'tanstack-query'],
    ['import { NextResponse } from "next/server";\nfunction GET() { return CURSORNextResponse.json({ ok: true }); }', 'nextjs'],
    ['import { ref as state } from "vue";\nfunction work() { const count = CURSORstate(0); }', 'vue'],
    ['import express from "express";\nconst app = express();\nCURSORapp.post("/users", handler);', 'express'],
    ['import { z } from "zod";\nconst User = CURSORz.object({ name: z.string() });', 'zod'],
    ['import { format as print } from "date-fns";\nconst value = CURSORprint(date, pattern);', 'date-fns'],
    ['import { of as source } from "rxjs";\nconst stream = CURSORsource(1, 2, 3);', 'rxjs'],
    ['import { createStore as store } from "zustand/vanilla";\nconst state = CURSORstore(() => ({ count: 0 }));', 'zustand'],
    ['import { expect as check } from "@jest/globals";\nCURSORcheck(1).toBe(1);', 'jest'],
  ]) {
    const result = context(source);
    assert.ok(retriever.relevant(result, 3).some(hit => hit.card.topics.includes(topic)), topic);
    assert.ok(retriever.relevantTopics(result, 2).includes(topic), `overview: ${topic}`);
  }
  const neutral = context('import { useState } from "react";\n\nfunction work() {\n CURSOR\n}');
  assert.ok(!retriever.relevantTopics(neutral).includes('react'));
  assert.equal(context('import { $state } from "react";\nfunction work() { CURSOR$state(0); }').focus, '$state react');
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
