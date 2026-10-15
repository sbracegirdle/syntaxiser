const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shellCues, shellAdapter } = require('../out/languages/shell');
const { Retriever } = require('../out/core/retrieval');
const { validatePack } = require('../out/core/pack');
const pack = validatePack({ ...require('../packs/shellscript.json'), referenceTopics: require('../packs/shellscript-reference.json') });
const probes = require('./fixtures/node-cli-probes.cjs');

test('Node commands and natural searches select practical examples and separate references', () => {
  const retriever = new Retriever(pack);
  for (const [source, topic] of [...probes, ['upgrade dependencies','node-updates'], ['dependency tree','node-inspect'],
    ['script arguments','node-scripts'], ['local binary','node-exec'], ['TypeScript','typescript'], ['test coverage','tool-vitest']]) {
    const query = probes.some(p=>p[0]===source) ? shellCues(source) : source;
    assert.equal(retriever.search(query)[0].card.topics[0], topic, query);
    assert.equal(retriever.searchTopics(query)[0], topic, query);
    if (probes.some(p=>p[0]===source)) {
      const context = shellAdapter.extract({text:source,offset:0,symbols:[],recentEdits:[]});
      assert.equal(retriever.relevant(context)[0].card.topics[0],topic,source);
      assert.equal(retriever.relevantTopics(context)[0],topic,source);
    }
  }
  for(const group of pack.referenceGroups.filter(g=>['node','typescript-tools'].includes(g.id))) {
    for(const id of group.topics) {
      assert.ok(pack.cards.some(c=>c.topics.includes(id)),id);
      assert.match(pack.referenceTopics.find(t=>t.id===id).rules.join(' '),/Reference: https:\/\//);
    }
  }
});
