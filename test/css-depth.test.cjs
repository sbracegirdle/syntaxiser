const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cssAdapter, maskCss } = require('../out/languages/web');
const { Retriever } = require('../out/core/retrieval');
const { validatePack } = require('../out/core/pack');
const pack = validatePack({...require('../packs/css.json'),referenceTopics:require('../packs/css-reference.json')});
const r=new Retriever(pack);
const ctx=source=>cssAdapter.extract({text:source.replace('|',''),offset:source.indexOf('|'),recentEdits:[],symbols:[]});
test('CSS depth natural tasks retrieve concrete cards and independently authored overviews',()=>{
  for(const [query,topic,id] of [
    ['flex min width overflow','flexbox','flex-minimum'],['grid auto fit','grid','grid-auto-fit'],
    ['stacking context','stacking','stacking-contained'],['sticky scroll container','sticky','sticky-heading'],
    ['logical properties','logical','logical-direction'],['reduced motion','preferences','preferences-motion'],
  ]) {
    assert.ok(r.search(query,3).some(x=>x.card.id===id),`${query}: ${r.search(query,3).map(x=>x.card.id)}`);
    assert.ok(r.searchTopics(query,3).includes(topic),query);
  }
  for(const topic of pack.concepts.slice(20)){
    assert.ok(pack.cards.filter(c=>c.topics.includes(topic.id)).length>=2,topic.id);
    const overview=pack.referenceTopics.find(t=>t.id===topic.id);
    assert.ok(overview.rules.length>=2&&overview.references.length);
    assert.ok(pack.cards.every(c=>c.code!==overview.syntax));
  }
});
test('CSS depth cursor scopes, selector variants and incomplete declarations retain property cues',()=>{
  for(const [source,topic] of [
    ['.title { min-width:0; flex:1 1 0; | }','flexbox'],
    ['@media (min-width:768px) {\n .card { writing-mode:vertical-rl; | }\n}','logical'],
    ['.nested:where(:has(input:invalid)) { z-index:2; | }','stacking'],
    ['.heading { position:sticky; top:0; |','sticky'],
    ['.label { overflow-wrap:anywhere; |','wrapping'],
    ['.x { grid-template-columns:subgrid; |','grid'],
    ['@media (forced-colors:active) { .control { |','preferences'],
    ['.x { margin-inline-start: |','logical'],
  ]) assert.ok(r.relevantTopics(ctx(source),4).includes(topic),`${source}: ${r.relevantTopics(ctx(source),4)}`);
});
test('CSS depth masks prose and misleading identifiers, preserving import and recent-edit cues',()=>{
  for(const source of ['/* position:sticky | */','.x { content:"stacking context logical properties |"; }','.x { content:"reduced motion |','.sticky.logical-properties.stacking-context { color:navy; | }']){
    assert.equal(maskCss(source).length,source.length);
    assert.ok(!r.relevantTopics(ctx(source)).some(t=>['sticky','logical','stacking','preferences'].includes(t)),source);
  }
  assert.ok(r.relevantTopics(ctx('@import "./bootstrap.css";|'),3).includes('bootstrap'));
  assert.ok(r.relevantTopics(ctx('@import "tailwindcss";|'),3).includes('tailwind'));
  const c=cssAdapter.extract({text:'\n',offset:0,symbols:[],recentEdits:['.x { position:sticky; top:0; }','/* grid-template-columns:subgrid */']});
  assert.ok(c.recentEdits.includes('position:sticky'));
  assert.ok(!c.recentEdits.includes('subgrid'));
  assert.ok(r.relevant(c,3).some(x=>x.card.topics.includes('sticky')));
  assert.equal(cssAdapter.extract({text:'.x { color:red; }',offset:8,recentEdits:[],symbols:[]}).languageId,'css');
});
test('CSS expansion exact fixtures and evidence remain exhaustive and stable',()=>{
  const fixtures=require('../playground/web/css-fixtures.json');
  const evidence=require('../coverage/languages.json').languages.css.evidence;
  for(const [id,f] of Object.entries(fixtures)){
    assert.ok(pack.cards.some(c=>c.id===id));
    assert.deepEqual(f.cases.map(c=>c.situation),['happy','edge','error']);
    assert.ok(f.cases.every(c=>c.expect.length&&c.note));
    assert.deepEqual(evidence.find(e=>e.card===id&&e.kind==='behavior').cases,['happy','edge','error']);
  }
  for(const c of pack.concepts.slice(20)) assert.ok(require('../coverage/languages.json').languages.css.requiredTopics.includes(c.id));
});
