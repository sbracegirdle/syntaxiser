const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sqlAdapter, sqlPackForDialect } = require('../out/languages/sql');
const { Retriever } = require('../out/core/retrieval');
const { validatePack } = require('../out/core/pack');
const pack = validatePack({ ...require('../packs/sql.json'), referenceTopics: require('../packs/sql-reference.json') });
const cases = require('../playground/sql/cases.json');
const context = source => sqlAdapter.extract({text: source.replace('|', ''), offset: source.indexOf('|'), symbols: [], recentEdits: ['JSONB RETURNING']});

for (const dialect of ['sqlite', 'postgresql']) {
  const selected = sqlPackForDialect(pack, dialect);
  const r = new Retriever(selected);
  for (const [query, topic, source] of [
    ['union distinct', 'set-operations', 'SELECT customer_id FROM orders UNION |SELECT id FROM customers'],
    ['case null', 'conditional', 'SELECT |CASE WHEN email IS NULL THEN 0 ELSE 1 END FROM customers'],
    ['recursive cte', 'recursive-cte', 'WITH RECURSIVE |team AS (SELECT id FROM employees)'],
    ['window frame ties', 'window-frames', 'SELECT SUM(total) OVER (ORDER BY total |RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM orders'],
    ['savepoint rollback', 'savepoints', 'ROLLBACK TO |optional_adjustment'],
    ['explain index scan', 'indexes', 'EXPLAIN |SELECT id FROM orders WHERE customer_id = 1'],
  ]) {
    test(`${dialect}: depth search and cursor ${query}`, () => {
      assert.ok(r.search(query, 3).some(x => x.card.topics.includes(topic)), query);
      assert.ok(r.relevant(context(source), 3).some(x => x.card.topics.includes(topic)), source);
    });
  }
  test(`${dialect}: aliases, incomplete edits, literals and unrelated identifiers`, () => {
    assert.ok(r.relevant(context('SELECT SUM(o.total) OVER (ORDER BY o.total |ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) FROM orders AS o'),3).some(x=>x.card.topics.includes('window-frames')));
    assert.ok(r.relevant(context('WITH RECURSIVE |walk AS ('),3).some(x=>x.card.topics.includes('recursive-cte')));
    for (const source of ["SELECT 'WITH RECURSIVE UNION CASE' |", '/* SAVEPOINT RANGE RECURSIVE */ |', 'SELECT "recursive cte" AS "window frame ties" |', 'SELECT recursive_cte, window_frame_ties FROM report |']) {
      const topics = r.relevantTopics(context(source), 40);
      assert.ok(!topics.includes('recursive-cte') && !topics.includes('window-frames'), source);
    }
    const ctx=context('WITH RECURSIVE walk AS (SELECT 1); SELECT id FROM customers |');
    assert.ok(!r.relevantTopics(ctx,40).includes('recursive-cte'));
    assert.equal(ctx.recentEdits, '');
  });
}

test('every exact SQL card has explicit happy, edge and rejection/recovery evidence', () => {
  for (const card of pack.cards) {
    const fixture=cases[card.id];
    assert.ok(Object.hasOwn(fixture,'expected'),card.id);
    assert.ok(fixture.edge && Object.hasOwn(fixture.edge,'expected'),card.id);
    assert.ok(fixture.error && (fixture.error.reject || fixture.error.query),card.id);
    assert.ok(fixture.edge.before !== undefined, card.id);
  }
  for (const topic of pack.concepts) {
    if (['distinct','set-operations','conditional','join-multiplicity','pagination','aggregate-filter','window-frames','recursive-cte','schema-evolution','savepoints','sqlite-conflict','sqlite-isolation','pg-isolation','sqlite-json','sqlite-time','pg-time'].includes(topic.id)) {
      assert.ok(pack.cards.filter(c=>c.topics.includes(topic.id)).length>=2,topic.id);
    }
  }
});
