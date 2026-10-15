const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sqlAdapter, maskSql, sqlPackForDialect } = require('../out/languages/sql');
const { Retriever } = require('../out/core/retrieval');
const { validatePack } = require('../out/core/pack');
const { withSqlCompanions } = require('../out/sqlCompanions');
const pack = validatePack({ ...require('../packs/sql.json'), referenceTopics: require('../packs/sql-reference.json') });
const context = source => sqlAdapter.extract({text:source.replace('CURSOR',''),offset:source.indexOf('CURSOR'),symbols:[],recentEdits:['-- JSONB RETURNING']});

test('SQL overviews are distinct from examples and every topic is grouped and executable', () => {
  assert.deepEqual(pack.referenceGroups.flatMap(g=>g.topics).sort(),pack.concepts.map(c=>c.id).sort());
  assert.equal(pack.referenceTopics.length, pack.concepts.length);
  for (const topic of pack.referenceTopics) {
    assert.ok(topic.references.length && topic.rules.length >= 2, topic.id);
    assert.ok(pack.cards.some(c=>c.topics.includes(topic.id) && c.explanation),topic.id);
    assert.ok(pack.cards.every(c=>c.code !== topic.syntax),topic.id);
  }
  assert.deepEqual(Object.keys(require('../playground/sql/cases.json')).sort(), pack.cards.map(c=>c.id).sort());
  assert.ok(require('../package.json').activationEvents.includes('onLanguage:sql'));
});

for (const dialect of ['sqlite','postgresql']) {
  test(`${dialect}: natural-language and incomplete cursor queries retrieve focused SQL`, () => {
    const selected = validatePack(sqlPackForDialect(pack,dialect));
    const r = new Retriever(selected);
    for (const [query,topic,source] of [
      ['join tables','joins','SELECT c.name FROM customers c JOIN orders o ON o.customer_id = c.id CURSOR'],
      ['missing related rows','missing','SELECT c.name FROM customers c LEFT JOIN orders o ON CURSOR'],
      ['group totals','aggregates','SELECT customer_id, SUM(total) FROM orders GROUP BY customer_id HAVING SUM(total) > CURSOR'],
      ['rank within group','windows','SELECT ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total CURSOR'],
      ['null comparison','null','SELECT COALESCE(email, \'unknown\') FROM customers WHERE email IS NULL CURSOR'],
      ['transaction rollback','transactions','BEGIN; UPDATE orders SET total = 9; ROLLBACK CURSOR'],
      ['parameterized query','parameters',`SELECT name FROM customers WHERE id = ${dialect === 'sqlite' ? '?' : '$1'} CURSOR`],
      ['common table expression','cte','WITH totals AS (SELECT SUM(total) FROM orders) CURSOR'],
    ]) {
      assert.ok(r.search(query,3).some(x=>x.card.topics[0]===topic),query);
      assert.ok(r.searchTopics(query,3).includes(topic),query);
      assert.ok(r.relevant(context(source),3).some(x=>x.card.topics[0]===topic),source);
      assert.ok(r.relevantTopics(context(source),3).includes(topic),source);
    }
    const excluded = dialect === 'sqlite' ? 'pg-json' : 'sqlite-setup';
    for (const query of ['jsonb pragma returning','postgresql upsert','sqlite foreign keys']) {
      assert.ok(r.search(query,60).every(x=>!x.card.topics.includes(excluded)));
      assert.ok(!r.searchTopics(query,60).includes(excluded));
    }
    assert.ok(selected.cards.every(c=>!c.dialects || c.dialects.includes(dialect)));
    assert.equal(r.search('parameterized query',1)[0].card.id,`sql-parameters${dialect==='postgresql'?'-postgresql':''}`);
  });
}

test('SQL masks escaped strings, quoted identifiers, nested comments and dollar strings with stable offsets', () => {
  for (const source of [
    `SELECT 'JOIN ''JSONB'' RETURNING; -- text' AS label; SELECT id FROM customers`,
    `SELECT "JOIN" AS "RETURNING", [JSONB], \`PRAGMA\` FROM customers`,
    `/* JOIN /* RETURNING */ JSONB */ SELECT id -- PRAGMA\nFROM customers`,
    `SELECT $$JOIN; RETURNING$$, $body$JSONB$body$, E'quoted\\' JOIN'`,
    `SELECT 'unterminated JOIN`, `SELECT $body$unterminated RETURNING`, `/* unfinished JSONB`,
  ]) {
    const masked = maskSql(source);
    assert.equal(masked.length,source.length);
    assert.equal(masked.split('\n').length,source.split('\n').length);
    for (const word of ['JOIN','JSONB','PRAGMA','RETURNING']) assert.ok(!masked.includes(word),source);
  }
  const r=new Retriever(sqlPackForDialect(pack,'postgresql'));
  for (const source of [`-- JOIN JSONB CURSOR`,`SELECT 'JOIN JSONB CURSOR'`,`SELECT "JOIN CURSOR"`,`/* JOIN JSONB CURSOR`]) {
    const topics=r.relevantTopics(context(source),50);
    assert.ok(!topics.includes('joins')&&!topics.includes('pg-json'),source);
  }
  const ctx=context(`SELECT payload::jsonb FROM documents;\nSELECT c."returning" FROM customers AS c WHERE c.id = $1 CURSOR`);
  assert.ok(!ctx.local.includes('jsonb'));
  assert.ok(!r.relevantTopics(ctx,50).includes('pg-json'));
  assert.equal(ctx.recentEdits,'','old edit text must not leak a previous statement into SQL context');
});

test('host-language companions remain separate, preserve existing IDs, and retrieve through API/import cues', () => {
  for (const [language, query, source, topic] of [
    ['python','python sqlite3','import sqlite3 as db\nconnection = CURSORdb.connect(path)','sqlite3-client'],
    ['go','database sql parameterized query','db.QueryRowContext(ctx, query, id).Scan(&name) CURSOR','database-sql'],
    ['typescript','node postgres parameterized query',"import type { Client } from 'pg';\nclient.query(CURSOR",'node-postgres'],
  ]) {
    const base={...require(`../packs/${language}.json`),referenceTopics:require(`../packs/${language}-reference.json`)};
    const merged=validatePack(withSqlCompanions(base));
    assert.deepEqual(merged.cards.slice(0,base.cards.length),base.cards);
    const adapter=require(`../out/languages/${language}`)[language + 'Adapter'];
    const r=new Retriever(merged);
    assert.equal(r.search(query,1)[0].card.topics[0],topic);
    const ctx=adapter.extract({text:source.replace('CURSOR',''),offset:source.indexOf('CURSOR'),symbols:[],recentEdits:[]});
    assert.ok(r.relevant(ctx,3).some(x=>x.card.topics[0]===topic),language);
  }
  const python=require('../packs/sql-companions.json').python;
  validatePack({schemaVersion:1,languageId:'python',displayName:'Python',...python});
  for (const extra of Object.values(require('../packs/sql-companions.json'))) {
    for (const overview of extra.referenceTopics) {
      assert.ok(overview.references.length && overview.rules.length >= 2);
      assert.ok(extra.cards.every(c=>c.code!==overview.syntax));
    }
  }
  assert.ok(pack.cards.every(c=>!c.code.includes('import ')&&!c.code.includes('package ')));
});

test('SQL starter lessons progress through all five levels with stable IDs and task-only snippets', () => {
  const { builtinLessons } = require('../out/lessons/catalog');
  assert.deepEqual(builtinLessons.sql.map(l=>l.difficulty),[1,2,3,4,5]);
  assert.equal(new Set(builtinLessons.sql.map(l=>l.id)).size,5);
  assert.ok(builtinLessons.sql.every(l=>l.instructions && l.check && l.starter===''));
});

test('dialect metadata rejects unknown, empty and duplicate values', () => {
  for (const dialects of [[],['mysql'],['sqlite','sqlite'],'sqlite',null]) {
    assert.throws(()=>validatePack({...pack,cards:[{...pack.cards[0],dialects}]}),/Invalid reference card/);
    assert.throws(()=>validatePack({...pack,referenceTopics:[{...pack.referenceTopics[0],dialects}]}),/Invalid reference topic/);
  }
});
