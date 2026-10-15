const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const { javaAdapter, maskJava } = require('../out/languages/java');
const pack = validatePack({ ...require('../packs/java.json'), referenceTopics: require('../packs/java-reference.json') });
const retriever = new Retriever(pack);
function extract(source, symbols = []) {
  return javaAdapter.extract({ text: source.replace('CURSOR', ''), offset: source.indexOf('CURSOR'), symbols, recentEdits: [] });
}
test('Java covers each topic with distinct examples, grouped overviews and official references', () => {
  assert.equal(pack.languageId, 'java');
  assert.deepEqual(new Set(pack.referenceTopics.map(t => t.id)), new Set(pack.concepts.map(t => t.id)));
  assert.deepEqual(new Set(pack.referenceGroups.flatMap(g => g.topics)), new Set(pack.concepts.map(t => t.id)));
  for (const topic of pack.referenceTopics) {
    assert.ok(topic.references.length);
    const cards = pack.cards.filter(c => c.topics.includes(topic.id));
    assert.ok(cards.length);
    assert.ok(cards.every(c => c.code !== topic.syntax));
  }
  assert.ok(require('../package.json').activationEvents.includes('onLanguage:java'));
});
for (const [query, id] of [
  ['close resource', 'resources'], ['stream group', 'stream-group'], ['optional value', 'optional'],
  ['jackson json', 'jackson-json'], ['junit parameterized', 'junit-parameterized'],
  ['spring boot endpoint', 'spring-endpoint'], ['read file', 'files'], ['async future', 'async'],
  ['spring validation', 'spring-validation'], ['spring error handling', 'spring-errors'],
  ['spring request test', 'spring-tests'], ['key value lookup', 'collections'],
]) test('Java search: ' + query, () => {
  assert.equal(retriever.search(query, 3)[0].card.topics[0], id);
  assert.ok(retriever.searchTopics(query).includes(id));
});
for (const [source, id] of [
  ['import com.fasterxml.jackson.databind.ObjectMapper;\nclass Demo { void run() { CURSORObjectMapper mapper = new ObjectMapper(); } }', 'jackson-json'],
  ['import java.util.stream.Collectors;\nclass Demo { void run() { CURSORCollectors.groupingBy(Item::name); } }', 'stream-group'],
  ['import org.junit.jupiter.params.ParameterizedTest;\nclass Demo {\n @CURSORParameterizedTest\n void run() {}\n}', 'junit-parameterized'],
  ['import org.springframework.web.bind.annotation.*;\n@CURSORRestController\nclass Demo {}', 'spring-endpoint'],
  ['class Demo { void run() { CURSOROptional.ofNullable(value); } }', 'optional'],
  ['import static org.junit.jupiter.api.Assertions.assertEquals;\nclass Demo { void run() { CURSORassertEquals(2, count); } }', 'junit'],
  ['class Demo { void run() { CURSORCompletableFuture.supplyAsync(() -> 1); } }', 'async'],
]) test('Java cursor/import cue: ' + id, () => {
  const context = extract(source);
  assert.ok(retriever.relevant(context, 3).some(r => r.card.topics[0] === id));
  assert.ok(retriever.relevantTopics(context, 3).includes(id));
});
test('Java brace scope handles types, constructors, methods, lambdas, compact records and incomplete edits', () => {
  for (const [source, scope] of [
    ['CURSORpackage example;', 'module'], ['class Demo { CURSORint field;', 'type'],
    ['interface Demo { CURSORvoid work(); }', 'type'], ['enum Mode { CURSORON, OFF }', 'type'],
    ['record Point(int x) { Point { CURSORif (x < 0) throw new IllegalArgumentException(); } }', 'function'],
    ['class Demo { Demo() { CURSORint value = 0; } }', 'function'],
    ['class Demo { void run(\n int x\n) throws Exception { if (true) { CURSORreturn; } } }', 'function'],
    ['class Demo { static { CURSORint x = 1; } }', 'function'],
    ['class Demo { Runnable run = () -> { CURSORreturn; }; }', 'function'],
    ['class Demo { void run() { } CURSORint field; }', 'type'],
    ['class Demo {}\nCURSOR', 'module'], ['class Demo { void unfinished() { CURSOR', 'function'],
  ]) assert.equal(extract(source).scope, scope, source);
  assert.equal(extract('CURSORunfinished', [{ name:'method', kind:5, start:0, end:100 }]).scope, 'function');
  assert.equal(extract('CURSORunfinished', [{ name:'Class', kind:4, start:0, end:100 }]).scope, 'type');
});
test('Java hides comments, text blocks and escaped literals while retaining line offsets', () => {
  const source = '// import org.junit.jupiter.api.Test;\n/* class Fake { Optional } */\nString text = "ObjectMapper \\" quote";\nchar ch = \'{\';\nString block = """\n  import java.util.Optional;\n  class Fake {}\n  """;\n';
  const masked = maskJava(source);
  assert.equal(masked.length, source.length);
  assert.equal(masked.split('\n').length, source.split('\n').length);
  assert.doesNotMatch(masked, /Optional|Fake|ObjectMapper|Test/);
  assert.equal(extract(source + 'CURSORvalue = 1;').imports, '');
  assert.doesNotMatch(maskJava('String block = """\nObjectMapper'), /ObjectMapper/);
  assert.match(maskJava('String unfinished = "Optional\nint real = 1;'), /int real/);
  const context = extract('import com.fasterxml.jackson.databind.ObjectMapper;\nCURSORvalue = 1;');
  assert.equal(context.focus.trim(), 'value');
  assert.deepEqual(retriever.relevantTopics(context), []);
});
test('Java lessons retain progress independently and have no implementation snippets', () => {
  const { LessonStore } = require('../out/core/lessons');
  const store = new LessonStore([{languageId:'java',displayName:'Java'}, {languageId:'rust',displayName:'Rust'}]);
  const lessons = store.libraries()[0].lessons;
  assert.deepEqual([...new Set(lessons.map(l => l.difficulty))], [1,2,3,4,5]);
  assert.ok(lessons.every(l => l.starter === ''));
  store.apply({ action:'status', languageId:'java', id:'java-greeting', status:'done' });
  const restored = new LessonStore([{languageId:'java',displayName:'Java'}, {languageId:'rust',displayName:'Rust'}], store.serialize());
  assert.equal(restored.libraries()[0].lessons[0].status, 'done');
  assert.ok(restored.libraries()[1].lessons.every(l => l.status === 'untracked'));
});
