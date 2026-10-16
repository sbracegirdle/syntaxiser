const { test } = require('node:test');
const assert = require('node:assert/strict');
const { maskGo, goAdapter } = require('../out/languages/go');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const pack = validatePack({ ...require('../packs/go.json'), referenceTopics: require('../packs/go-reference.json') });
const retriever = new Retriever(pack);
function context(source, extra = {}) {
  const offset = source.indexOf('|');
  return goAdapter.extract({ text: source.replace('|', ''), offset, symbols: [], recentEdits: [], ...extra });
}

test('Go catalog covers every topic with separately authored overviews and practical examples', () => {
  assert.equal(pack.languageId, 'go');
  assert.equal(pack.concepts.length, 33);
  assert.equal(pack.referenceGroups.length, 6);
  const grouped = pack.referenceGroups.flatMap(group => group.topics);
  assert.equal(new Set(grouped).size, pack.concepts.length);
  for (const concept of pack.concepts) {
    const overview = pack.referenceTopics.find(topic => topic.id === concept.id);
    assert.ok(overview?.syntax && overview.rules.length);
    assert.ok(pack.cards.some(card => card.topics.includes(concept.id)));
    assert.ok(pack.cards.every(card => card.code !== overview.syntax));
  }
});

test('Go scanner hides comments, raw and escaped strings and runes without changing offsets', () => {
  const text = '// func fake() {\n/* struct { */\nvar raw = `func fake() {\n}`\nvar s = "escaped \\" {"\nvar r = \'{\'\n';
  const masked = maskGo(text);
  assert.equal(masked.length, text.length);
  assert.equal(masked.split('\n').length, text.split('\n').length);
  assert.ok(!masked.includes('{'));
  assert.equal(context(text + '|').scope, 'module');
  for (const source of [
    'func main() {\n if true { | }\n}',
    'func (c *Counter) Add() { | }',
    'func add(\n a int,\n b int,\n) int { | return a+b }',
  ]) assert.equal(context(source).scope, 'function');
  assert.equal(context('type User struct {\n |Name string\n}').scope, 'type');
  assert.equal(context('type Reader interface {\n |Read([]byte) (int, error)\n}').scope, 'type');
  assert.equal(context('func main() {}\n|').scope, 'module');
});

test('Go import paths survive literal masking and comments do not create imports', () => {
  const source = '// import "fake"\nimport (\n "fmt"\n alias "net/http"\n)\nfunc main() { | }';
  const result = context(source);
  assert.match(result.imports, /net\/http/);
  assert.match(result.imports, /fmt/);
  assert.ok(!result.imports.includes('fake'));
  assert.equal(context('import "os"\n|').imports, 'import "os"');
  assert.equal(context('|func main() {}', { symbols: [{ name:'main',kind:12,start:0,end:30 }] }).scope, 'function');
});

test('Go cursor syntax and natural searches retrieve relevant topics', () => {
  const searches = { 'key value lookup': 'maps', 'propagate error': 'errors', 'goroutine': 'goroutines', 'cleanup': 'defer', 'unicode': 'strings', 'type assertion': 'assertions', 'generic': 'generics' };
  for (const [query, topic] of Object.entries(searches)) assert.equal(retriever.search(query, 1)[0]?.card.topics[0], topic, query);
  for (const [line, topic] of [['values := map[string]int{}', 'maps'], ['defer file.Close()', 'defer'], ['select {', 'select'], ['go work()', 'goroutines']]) {
    const result = context(`func main() {\n |${line}\n}`);
    assert.ok(retriever.relevant(result, 3).some(hit => hit.card.topics.includes(topic)), line);
  }
  const top = retriever.relevant(context('|\nfunc main() {}'), 5);
  assert.ok(top.some(hit => hit.card.id === 'import'));
});

test('Go standard-library searches and real cursor probes remain focused', () => {
  const profile = require('../coverage/languages.json').languages.go;
  for (const probe of profile.searches) assert.ok(retriever.search(probe.query, 3).some(h => h.card.topics.includes(probe.topic)), probe.query);
  for (const probe of profile.cursors) assert.ok(retriever.relevant(context(probe.source), 3).some(h => h.card.topics.includes(probe.topic)), probe.source);
  for (const [query, topic] of [['json validation','json'],['http handler','http'],['context cancellation','context'],['mutex','sync'],['read file','files'],['benchmark report','benchmarks']]) {
    assert.ok(retriever.search(query,3).some(h=>h.card.topics.includes(topic)),query);
  }
  for (const source of ['func main() {\n // json.NewDecoder ctx.Err mu.Lock\n |x := 1\n}', 'func main() {\n s := `json.NewDecoder ctx.Err mu.Lock`\n |x := 1\n}']) {
    const c=context(source);assert.doesNotMatch(c.local,/json\.NewDecoder|ctx\.Err|mu\.Lock/);
  }
  assert.ok(retriever.relevant(context('func main() {\n |json.NewDecoder(\n}'),3).some(h=>h.card.topics.includes('json')));
});

test('Go generated fixtures consume exact card code and reject a catalog-only broken contract', () => {
  const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
  const {generate,run}=require('../scripts/check-go-standard-library.cjs');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'syntaxiser-go-mutation-'));
  try {
    generate(dir);
    for (const id of Object.keys(require('../playground/go/standard-library/catalog-checks.json'))) {
      assert.ok(fs.readFileSync(path.join(dir,id,'catalog_test.go'),'utf8').includes(pack.cards.find(c=>c.id===id).code));
    }
    const mutated=structuredClone(pack.cards);
    mutated.find(c=>c.id==='sync-counter').code=mutated.find(c=>c.id==='sync-counter').code.replace('c.value += delta','c.value += delta + 1');
    generate(dir,mutated);
    assert.throws(()=>run(['test','-count=1','./sync-counter'],dir),/go test.*failed/);
    assert.throws(()=>generate(dir,pack.cards.filter(c=>c.id!=='json-config')),/Missing catalog card/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
