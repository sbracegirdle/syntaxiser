// Compile the exact displayed catalog examples, then run behavioral JUnit checks.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = path.join(root, 'playground/java');
const pack = require('../packs/java.json');
const checks = require('../playground/java/catalog-checks.json');
const testCards = new Set(['junit', 'junit-parameterized', 'spring-tests']);
const apiCards = new Set(['spring-endpoint', 'spring-errors']); // Behavior exercised through MockMvc.
const generated = path.join(fixture, 'target/catalog');
fs.rmSync(generated, { recursive: true, force: true });
// Removed or renamed cards must not survive as stale compiled classes/tests.
for (const directory of ['classes', 'test-classes', 'surefire-reports']) {
  fs.rmSync(path.join(fixture, 'target', directory), { recursive: true, force: true });
}
for (const kind of ['main', 'test']) fs.mkdirSync(path.join(generated, kind, 'syntaxiser/playground'), { recursive: true });
for (const card of pack.cards) {
  if (!testCards.has(card.id) && !apiCards.has(card.id) && !checks[card.id]) throw Error(`Missing behavior check: ${card.id}`);
  const kind = testCards.has(card.id) ? 'test' : 'main';
  const name = card.id.replace(/(^|-)([a-z])/g, (_, prefix, letter) => letter.toUpperCase());
  fs.writeFileSync(path.join(generated, kind, 'syntaxiser/playground', `${name}Example.java`),
    `package syntaxiser.playground;\n\n${card.code}\n`);
}
for (const id of Object.keys(checks)) if (!pack.cards.some(card => card.id === id)) throw Error(`Stale behavior check: ${id}`);
fs.writeFileSync(path.join(generated, 'test/syntaxiser/playground/CatalogBehaviorTest.java'),
  `package syntaxiser.playground;\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\nclass CatalogBehaviorTest {\n` +
  Object.entries(checks).map(([id, body]) => `@Test void ${id.replaceAll('-', '_')}() throws Exception {\n${body}\n}`).join('\n') + '\n}\n');
console.log(`Generated ${pack.cards.length} catalog examples and ${Object.keys(checks).length} behavioral checks.`);
if (!process.argv.includes('--generate-only')) {
  const result = spawnSync(process.env.MAVEN_BIN || 'mvn', ['--batch-mode', '--no-transfer-progress', '-f', path.join(fixture, 'pom.xml'), 'test'], { stdio:'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
