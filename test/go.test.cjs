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
  assert.equal(pack.concepts.length, 29);
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


test('Go library searches return practical tasks and independent API references', () => {
  for (const [query, topic] of [['gin json validation','gin'], ['gin cancellation','gin'], ['chi router parameter','chi'], ['chi middleware cancellation','chi'], ['testify mock','testify'], ['require assertion','testify']]) {
    assert.ok(retriever.search(query,3).some(hit => hit.card.topics[0] === topic), query);
    assert.ok(retriever.searchTopics(query,3).includes(topic), query);
  }
  for (const topic of ['gin','chi','testify']) {
    assert.ok(pack.cards.filter(card => card.topics[0] === topic).length >= 2);
    const overview=pack.referenceTopics.find(t=>t.id===topic);
    assert.ok(overview.references.length >= 2);
  }
});

test('Go library selectors resolve imports, aliases, incomplete edits and recent edits', () => {
  for (const [path,alias,selector,topic] of [
    ['github.com/gin-gonic/gin','web','New','gin'],
    ['github.com/go-chi/chi/v5','route','NewRouter','chi'],
    ['github.com/stretchr/testify/require','check','NoError','testify'],
    ['github.com/stretchr/testify/mock','double','Mock','testify'],
  ]) {
    for (const expression of [`${alias}.${selector}(`, `${alias}.`]) {
      const ctx=context(`import ${alias} "${path}"\nfunc main() {\n |${expression}\n}`);
      assert.ok(retriever.relevant(ctx,3).some(h=>h.card.topics.includes(topic)), expression);
      assert.ok(ctx.currentLine.includes(topic+'.'));
      assert.equal(ctx.scope,'function');
    }
    const ctx=context(`import (\n ${alias} "${path}"\n)\nfunc main() {\n |\n}`,{recentEdits:[`${alias}.${selector}(`]});
    assert.ok(ctx.recentEdits.includes(topic+'.'));
    assert.ok(retriever.relevant(ctx,5).some(h=>h.card.topics.includes(topic)), topic+' recent edit');
    assert.ok(context(`import ${alias} |"${path}"`).cues.includes(topic));
  }
  const type=context('import double "github.com/stretchr/testify/mock"\ntype Store struct {\n |double.Mock\n}');
  assert.equal(type.scope,'type');
  assert.ok(retriever.relevant(type,3).some(h=>h.card.topics.includes('testify')));
  assert.match(context('import (\n web "github.com/gin-gonic/gin"\n|').imports,/gin-gonic/);
});

test('Go comments, strings, blank imports and misleading names do not create library selectors', () => {
  const ctx=context('import (\n // fake "github.com/gin-gonic/gin"\n "fmt"\n)\nfunc main() {\n |fmt.Println("web.New() gin.New()")\n}');
  assert.ok(!ctx.imports.includes('gin-gonic'));
  assert.ok(!ctx.currentLine.includes('gin'));
  for (const literal of ['// web.New()', 's := "web.New()"', 's := `web.New()`']) {
    const c=context(`import web "github.com/gin-gonic/gin"\nfunc main() {\n |${literal}\n}`);
    assert.ok(!c.currentLine.includes('gin.'));
  }
  for (const declaration of ['_ "github.com/gin-gonic/gin"', '. "github.com/gin-gonic/gin"', 'web "example.com/not-gin"']) {
    const c=context(`import ${declaration}\nfunc main() {\n |web.New()\n}`);
    assert.ok(!c.currentLine.includes('gin.'));
  }
  const c=context('func main() {\n |begin := "gin"\n}');
  assert.ok(!c.cues.includes('gin'));
});
