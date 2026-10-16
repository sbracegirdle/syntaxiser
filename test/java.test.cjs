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

const depthTopics = ['enums-switch','patterns','arrays-varargs','equality','comparators','immutable',
  'generic-bounds','nested-types','functions','stream-reduce','strings-regex','decimal','datetime','uuid','file-walk','http-client'];
test('Java depth units retain separate overviews and two distinct practical tasks', () => {
  const profile = require('../coverage/languages.json').languages.java;
  for (const id of depthTopics) {
    assert.ok(profile.requiredTopics.includes(id), id);
    assert.ok(pack.referenceTopics.some(t => t.id === id), id);
    const cards = pack.cards.filter(c => c.topics[0] === id);
    assert.ok(cards.length >= 2, id);
    assert.equal(new Set(cards.map(c => c.code)).size,cards.length,id);
  }
  const fixtures = require('../playground/java/catalog-fixtures.json');
  const checks = require('../playground/java/catalog-checks.json');
  assert.deepEqual(new Set([...Object.keys(checks),...fixtures.testCards,...fixtures.apiCards]),new Set(pack.cards.map(c => c.id)));
});
for (const [query,topic] of [
  ['switch expression','enums-switch'],['comparator null ordering','comparators'],
  ['generic wildcard','generic-bounds'],['decimal money','decimal'],
  ['datetime zone','datetime'],['completable future error','async'],
  ['regex literal replacement','strings-regex'],['immutable snapshot','immutable'],
  ['flatten list','stream-reduce'],['walk directory','file-walk'],['http status error','http-client'],
]) test('Java expanded search: '+query, () => {
  assert.ok(retriever.search(query,3).some(r => r.card.topics.includes(topic)),query);
});
for (const [source,topic] of [
  ['class Demo { int days(Mode mode) { return CURSORswitch(mode) { case FAST -> 1; default -> 5; }; }}','enums-switch'],
  ['class Demo { boolean accepts(Object x) { return x CURSORinstanceof String s && !s.isBlank(); }}','patterns'],
  ['import java.math.BigDecimal;\nclass Demo { void calculate() { var price = new CURSORBigDecimal("1.00"); }}','decimal'],
  ['import static java.util.Comparator.nullsLast;\nclass Demo { void sort() { CURSORnullsLast(order); }}','comparators'],
  ['import java.time.ZoneId;\nclass Demo { void display() { CURSORZoneId.of("UTC"); }}','datetime'],
  ['import java.net.http.HttpClient;\nclass Demo { void send() { CURSORHttpClient.newHttpClient(); }}','http-client'],
  ['class Demo { void walk() { CURSORFiles.walk(root','file-walk'],
  ['class Demo { <T extends Comparable<? super T>> T largest(java.util.List<CURSOR? extends T> values) {','generic-bounds'],
  ['class Demo { void normalize() { CURSORFunction<String,String> clean = String::strip; }}','functions'],
]) test('Java expanded cursor: '+topic, () => {
  const context = extract(source);
  assert.ok(retriever.relevant(context,3).some(r => r.card.topics.includes(topic)),JSON.stringify(context));
});
test('Java expanded lexical cues respect comments, strings, misleading identifiers and recent edits', () => {
  const source = 'import java.math.BigDecimal;\nclass Demo { void work() {\n // BigDecimal Comparator HttpClient\n String label = "ZonedDateTime UUID Files.walk";\n CURSORvalue = BigDecimalish;\n}}';
  const context = extract(source);
  assert.doesNotMatch(context.currentLine,/java.math.BigDecimal/);
  assert.ok(!retriever.relevantTopics(context).includes('decimal'));
  const input = { text:'class Demo { void work() {\n value = 1; }}',offset:28,symbols:[],
    recentEdits:['// BigDecimal is a comment','String note = "Comparator";','new java.math.BigDecimal('] };
  const edited = javaAdapter.extract(input);
  assert.doesNotMatch(edited.recentEdits,/comment|Comparator/);
  assert.match(edited.recentEdits,/BigDecimal/);
  assert.ok(retriever.relevant(edited,3).some(r => r.card.topics.includes('decimal')));
  assert.equal(extract('class Outer { static class Nested { void unfinished() { CURSOR').scope,'function');
  assert.equal(extract('class Outer { class Inner { CURSORint position; } }').scope,'type');
});
