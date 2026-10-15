const { test } = require('node:test');
const assert = require('node:assert/strict');
const { htmlAdapter, cssAdapter, maskHtml, maskCss } = require('../out/languages/web');
const { Retriever } = require('../out/core/retrieval');
const { validatePack } = require('../out/core/pack');
const packs = Object.fromEntries(['html', 'css'].map(id => [id, validatePack({ ...require(`../packs/${id}.json`), referenceTopics: require(`../packs/${id}-reference.json`) })]));
function context(adapter, source) {
  return adapter.extract({ text: source.replace('CURSOR', ''), offset: source.indexOf('CURSOR'), recentEdits: [], symbols: [] });
}
for (const [id, adapter, probes] of [
  ['html', htmlAdapter, [
    ['email validation','inputs','<input type="email" required CURSOR>'],
    ['accessible data table','tables','<table><tr><th scope="col">PlantCURSOR</th></tr></table>'],
    ['responsive images','images','<img\n srcset="small.svg 480w, large.svg 960w"\n alt="SeedlingCURSOR">'],
    ['disclosure','details','<details><summary>WateringCURSOR</summary></details>'],
    ['bootstrap button','bootstrap','<button class="btn btn-primaryCURSOR">Save</button>'],
    ['tailwind card','tailwind','<article class="rounded-lg p-4 shadowCURSOR">Card</article>'],
  ]],
  ['css', cssAdapter, [
    ['responsive grid','grid','.beds { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); CURSOR }'],
    ['center element flex','flexbox','.toolbar { display: flex; align-items: center; CURSOR }'],
    ['css variables','variables',':root { --garden-accent: #166534; CURSOR }'],
    ['container query','container','@container (min-width: 30rem) { .summary { CURSOR } }'],
    ['focus visible','states','.save:focus-visible { outline: 3px solid blue; CURSOR }'],
    ['bootstrap variables','bootstrap','.btn.garden-action { --bs-btn-bg: green; CURSOR }'],
    ['tailwind theme','tailwind','@theme { --color-garden: green; CURSOR }'],
  ]],
]) {
  test(`${id} catalog has complete distinct references, grouped topics and practical retrieval`, () => {
    const pack = packs[id], retriever = new Retriever(pack);
    assert.deepEqual(pack.referenceGroups.flatMap(group => group.topics).sort(), pack.concepts.map(c=>c.id).sort());
    for (const topic of pack.referenceTopics) {
      assert.ok(topic.references.length && topic.rules.length >= 2);
      assert.ok(pack.cards.some(c => c.topics.includes(topic.id) && c.explanation));
      assert.ok(pack.cards.every(c => c.code !== topic.syntax));
    }
    for (const [query, topic, source] of probes) {
      assert.ok(retriever.search(query, 3).some(r=>r.card.topics[0] === topic), query);
      assert.ok(retriever.searchTopics(query, 3).includes(topic), query);
      const ctx = context(adapter, source);
      assert.ok(retriever.relevant(ctx, 3).some(r=>r.card.topics[0] === topic), source);
      assert.ok(retriever.relevantTopics(ctx, 3).includes(topic), source);
    }
    assert.ok(require('../package.json').activationEvents.includes(`onLanguage:${id}`));
  });
}
test('HTML masks prose, comments and raw script/style bodies with stable offsets', () => {
  const source = '<!-- <input required> -->\n<p>bootstrap grid</p>\n<script>const x = "<input>";</script>\n<style>.grid { display: grid; }</style>\n<img alt="seedling">';
  const masked = maskHtml(source);
  assert.equal(masked.length, source.length);
  assert.equal(masked.split('\n').length, source.split('\n').length);
  assert.ok(!masked.includes('bootstrap') && !masked.includes('const x') && !masked.includes('display: grid') && !masked.includes('<input'));
  assert.ok(masked.includes('<img alt="seedling">'));
  const retriever = new Retriever(packs.html);
  for (const source of ['<!-- <input CURSORrequired> -->','<p>CURSORbootstrap</p>','<script>CURSOR"<input>"</script>']) {
    const topics = retriever.relevantTopics(context(htmlAdapter,source));
    assert.ok(!topics.includes('inputs') && !topics.includes('bootstrap'), source);
  }
  assert.match(context(htmlAdapter,'<input\n data-test="a > b"\n type="emailCURSOR">').focus, /<input[\s\S]*email/);
  assert.match(context(htmlAdapter,'<input\n type="emailCURSOR"').focus, /<input/);
});
test('CSS masks comments and strings while retaining Tailwind import cues', () => {
  const source = '/* display: grid */\n.note::after { content: "display: flex"; }\n@import "tailwindcss";';
  const masked = maskCss(source);
  assert.equal(masked.length, source.length);
  assert.ok(!masked.includes('display: grid') && !masked.includes('display: flex'));
  assert.ok(masked.includes('tailwindcss'));
  const retriever = new Retriever(packs.css);
  assert.equal(retriever.relevantTopics(context(cssAdapter,'@import "tailwindcssCURSOR";'))[0], 'tailwind');
  assert.equal(retriever.relevantTopics(context(cssAdapter,'.note { content: "display: gridCURSOR"; }')).includes('grid'),false);
});
