const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const { pythonAdapter, maskPython, pythonScopeAt } = require('../out/languages/python');
const pack = validatePack({ ...require('../packs/python.json'), referenceTopics: require('../packs/python-reference.json') });
const retriever = new Retriever(pack);
function extract(source, symbols = []) {
  const offset = source.indexOf('CURSOR');
  return pythonAdapter.extract({ text: source.replace('CURSOR', ''), offset, symbols, recentEdits: [] });
}
test('Python catalogs cover all concepts exactly once, with separate overviews and valid learning links', () => {
  assert.equal(pack.languageId, 'python');
  assert.equal(new Set(pack.cards.map(c => c.id)).size, pack.cards.length);
  assert.deepEqual(new Set(pack.referenceTopics.map(t => t.id)), new Set(pack.concepts.map(t => t.id)));
  assert.deepEqual(new Set(pack.referenceGroups.flatMap(g => g.topics)), new Set(pack.concepts.map(t => t.id)));
  for (const topic of pack.referenceTopics) {
    assert.ok(topic.references.length);
    assert.ok(topic.references.every(r => r.url.startsWith('https://')));
    assert.ok(pack.cards.filter(c => c.topics.includes(topic.id)).every(c => c.code !== topic.syntax));
  }
  assert.ok(require('../package.json').activationEvents.includes('onLanguage:python'));
});
for (const [query, id] of [
 ['read csv', 'csv'], ['read file with pathlib', 'pathlib'], ['handle exception', 'exceptions'],
 ['pytest fixture', 'pytest-fixtures'], ['pytest parametrize', 'pytest-parametrize'], ['httpx timeout', 'httpx'],
 ['pydantic validation', 'pydantic'], ['fastapi request', 'fastapi'], ['cancel task', 'async'],
 ['slice', 'slicing'], ['generator', 'generators'], ['dataclass', 'dataclasses'], ['type hints', 'typing'],
]) test('Python search: ' + query, () => {
  assert.equal(retriever.search(query, 3)[0].card.topics[0], id);
  assert.ok(retriever.searchTopics(query).includes(id));
});
for (const [source, id] of [
 ['import httpx as web\nwith web.Client() as client:\n    CURSORweb.get(url)', 'httpx'],
 ['from pathlib import Path as P\npath = CURSORP("x")', 'pathlib'],
 ['import csv as rows\nCURSORrows.DictReader(stream)', 'csv'],
 ['import pytest as pt\n@CURSORpt.fixture\ndef resource():\n    pass', 'pytest-fixtures'],
 ['from pydantic import (\n    BaseModel as Model,\n    Field,\n)\nclass Order(CURSORModel):\n    pass', 'pydantic'],
 ['from fastapi import FastAPI as API\napp = CURSORAPI()', 'fastapi'],
 ['from fastapi.testclient import TestClient as TC\nwith CURSORTC(app) as client:\n    pass', 'fastapi'],
 ['def work():\n    try:\n        int(value)\n    CURSORexcept ValueError:\n        pass', 'exceptions'],
 ['def work():\n    CURSORyield 1', 'generators'],
]) test('Python cursor/import cue: ' + id + ' ' + source.split('\n')[0], () => {
  const context = extract(source);
  assert.ok(retriever.relevant(context, 3).some(r => r.card.topics[0] === id));
  assert.ok(retriever.relevantTopics(context, 3).includes(id));
});
test('Python scope uses indentation, nested methods, dedents, tabs and multiline headers', () => {
  for (const [source, scope] of [
    ['class Basket:\n    CURSORitems = []', 'type'],
    ['class Basket:\n    def add(self):\n        if True:\n            CURSORreturn 1', 'function'],
    ['def f():\n    pass\nCURSORvalue = 3', 'module'],
    ['async def f(\n    value,\n):\n    CURSORawait work()', 'function'],
    ['def f():\n\tCURSORreturn 1', 'function'],
    ['def f():\n    data = [\n0,\n1,\n    ]\n    CURSORreturn data', 'function'],
    ['def unfinished():\n    CURSOR', 'function'],
    ['class Parent:\n    def method(self):\n        pass\n    CURSORvalue = 1', 'type'],
  ]) assert.equal(extract(source).scope, scope, source);
  const source = 'def f():\n    # class Fake:\n    CURSORreturn 1';
  assert.equal(extract(source).scope, 'function');
});
test('Python masks strings, comments, escapes and triple-quoted docstrings without offset changes', () => {
  const source = '# import httpx\nx = r"fastapi \\"quoted\\""\ny = f"{pydantic.BaseModel}"\nz = """class Fake:\n    import pytest\n"""\nvalue = 1';
  const masked = maskPython(source);
  assert.equal(masked.length, source.length);
  assert.equal(masked.split('\n').length, source.split('\n').length);
  assert.doesNotMatch(masked, /httpx|fastapi|pydantic|pytest|Fake/);
  const context = extract(source + '\nCURSORvalue = 2');
  assert.equal(context.imports, '');
  assert.deepEqual(retriever.relevantTopics(context), []);
  assert.equal(maskPython('x = """unterminated\nimport httpx').includes('httpx'), false);
  assert.equal(extract('import httpx\nCURSORvalue = 2').focus.trim(), 'value');
  assert.deepEqual(retriever.relevantTopics(extract('import httpx\nCURSORvalue = 2')), []);
});
test('Python document symbols refine lexical fallback during incomplete edits', () => {
  assert.equal(extract('CURSORvalue = 1', [{ name:'f', kind:12, start:0, end:20 }]).scope, 'function');
});

test('Python hides complete modern f-strings with same-quote, nested and multiline expressions', () => {
  for (const source of [
    'value = f"{data["httpx"]}"',
    'value = f"{f"{data["fastapi"]}"}"',
    'value = f"{{literal}} { {"pytest": 1} }"',
    'value = f"{data[ # pydantic\n"httpx"]}"',
    'value = f"""{data["fastapi"]}\n{data["pytest"]}"""',
  ]) {
    const masked = maskPython(source + '\nresult = 1');
    assert.equal(masked.length, source.length + '\nresult = 1'.length);
    assert.doesNotMatch(masked, /httpx|fastapi|pytest|pydantic|literal|data/);
    assert.match(masked, /result = 1/);
  }
});
test('Python built-in progress survives reload independently and reset is scoped', () => {
  const { LessonStore } = require('../out/core/lessons');
  const languages = [{languageId:'python',displayName:'Python'}, {languageId:'rust',displayName:'Rust'}];
  const store = new LessonStore(languages);
  store.apply({action:'status',languageId:'python',id:'hello',status:'hidden'});
  store.apply({action:'status',languageId:'rust',id:'hello',status:'done'});
  const restored = new LessonStore(languages, store.serialize());
  assert.equal(restored.libraries()[0].lessons.find(l=>l.id==='hello').status, 'hidden');
  assert.equal(restored.libraries()[1].lessons.find(l=>l.id==='hello').status, 'done');
  restored.reset('python', false, false);
  assert.equal(restored.libraries()[0].lessons.find(l=>l.id==='hello').status, 'untracked');
  assert.equal(restored.libraries()[1].lessons.find(l=>l.id==='hello').status, 'done');
});

for (const [query, topic] of [
  ['keyword only arguments', 'arguments'], ['mutable default', 'arguments'],
  ['counter words', 'collection-tools'], ['decimal rounding', 'decimal'],
  ['timezone datetime', 'datetime'], ['async task cancellation', 'task-groups'],
  ['shallow copy', 'copying'], ['match case', 'matching'], ['property setter', 'properties'],
  ['iterator protocol', 'iterators'], ['generator send', 'generator-lifecycle'],
  ['regex fullmatch', 'text-regex'], ['itertools groupby', 'itertools'],
  ['functools partial', 'functools'], ['async timeout', 'timeouts'],
]) test('Python depth search in first three: ' + query, () => {
  assert.ok(retriever.search(query, 3).some(hit => hit.card.topics.includes(topic)));
  assert.ok(retriever.searchTopics(query).includes(topic));
});
for (const [source, topic] of [
  ['from decimal import Decimal as D\namount = CURSORD("1.25")', 'decimal'],
  ['import collections as c\ncounts = CURSORc.Counter(words)', 'collection-tools'],
  ['from datetime import datetime as DT\nwhen = CURSORDT.fromisoformat(text)', 'datetime'],
  ['from itertools import groupby as group\nfor key, rows in CURSORgroup(data):\n    pass', 'itertools'],
  ['from functools import partial as bind\nparser = CURSORbind(int, base=16)', 'functools'],
  ['import asyncio as aio\nasync def work():\n    async with CURSORaio.TaskGroup() as group:\n        pass', 'task-groups'],
  ['import re as regex\ndef valid(text):\n    return CURSORregex.fullmatch(pattern, text)', 'text-regex'],
  ['class Stock:\n    @CURSORproperty\n    def quantity(self):\n        return 0', 'properties'],
  ['match payload:\n    CURSORcase {"kind": "add"}:\n        pass', 'matching'],
  ['async def work():\n    async with asyncio.CURSORtimeout(', 'timeouts'],
]) test('Python depth alias/scope/incomplete cursor: ' + topic, () => {
  assert.ok(retriever.relevant(extract(source), 3).some(hit => hit.card.topics.includes(topic)), source);
});
test('Python new topic names in comments, strings, unused imports and misleading identifiers do not supply API cues', () => {
  for (const source of [
    '# Decimal Counter TaskGroup\nCURSORvalue = 2',
    'text = "Decimal Counter TaskGroup"\nCURSORvalue = 2',
    'from decimal import Decimal as D\nCURSORvalue = 2',
    'CURSORDecimalReport = 2',
    'x = """unterminated Decimal\nCURSORCounter',
  ]) {
    assert.deepEqual(retriever.relevantTopics(extract(source)), [], source);
  }
});
test('Python recent edits retain real depth cues and mask fabricated cues', () => {
  const context = pythonAdapter.extract({text:'value = 1', offset:0, symbols:[], recentEdits:['# TaskGroup', 'amount = "Counter"', 'from decimal import Decimal']});
  assert.match(context.recentEdits, /Decimal/);
  assert.doesNotMatch(context.recentEdits, /Counter|TaskGroup/);
  const neutral = { ...context, recentEdits: '' };
  const score = ctx => retriever.relevant(ctx, pack.cards.length).find(hit => hit.card.id === 'decimal-money').score;
  assert.ok(score(context) > score(neutral));
  assert.deepEqual(retriever.relevantTopics(context), []); // Overview suggestions intentionally ignore history.
});
