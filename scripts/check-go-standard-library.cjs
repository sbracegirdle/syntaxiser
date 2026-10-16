// Generate isolated packages from exact catalog text; never execute handwritten copies.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixtures = require('../playground/go/standard-library/catalog-checks.json');
const pack = require('../packs/go.json');
function generate(directory, cards = pack.cards) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'go.mod'), 'module syntaxiser.local/standardlibrary\n\ngo 1.22.0\n\ntoolchain go1.26.5\n');
  for (const [id, fixture] of Object.entries(require('../playground/go/standard-library/legacy-compile.json'))) {
    const card = cards.find(c => c.id === id);
    if (!card) throw Error('Missing legacy card: ' + id);
    const target = path.join(directory, 'legacy-' + id);
    fs.mkdirSync(target, { recursive: true });
    const header = card.code.startsWith('package ') ? '' : 'package example\n';
    const imports = fixture.imports.length ? 'import (\n' + fixture.imports.map(i => JSON.stringify(i)).join('\n') + '\n)\n' : '';
    fs.writeFileSync(path.join(target, 'catalog_test.go'), header + imports + fixture.prefix + '\n' + card.code + fixture.suffix + '\n');
  }
  for (const [id, fixture] of Object.entries(fixtures)) {
    const card = cards.find(c => c.id === id);
    if (!card) throw Error('Missing catalog card: ' + id);
    const target = path.join(directory, id);
    fs.mkdirSync(target, { recursive: true });
    const imports = [...new Set([...fixture.imports, ...fixture.testImports])];
    // All declarations are package scoped; tests/benchmarks belong to *_test.go.
    const source = `package example\nimport (\n${imports.map(i => JSON.stringify(i)).join('\n')}\n)\n${card.code}\n${fixture.tests}\n`;
    fs.writeFileSync(path.join(target, 'catalog_test.go'), source);
  }
}
function run(args, directory) {
  const result = spawnSync('go', args, { cwd: directory, encoding: 'utf8', timeout: 180_000,
    maxBuffer: 10 * 1024 * 1024, env: { ...process.env, GOTOOLCHAIN: 'local', GOWORK: 'off', GOPROXY: 'off' } });
  if (result.error || result.status !== 0) throw Error(`go ${args.join(' ')} failed\n${result.error?.message || ''}\n${result.stdout || ''}${result.stderr || ''}`);
  return result.stdout;
}
if (require.main === module) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-go-standard-'));
  try {
    console.log(run(['version'], root).trim());
    generate(directory);
    console.log(run(['test', '-race', '-count=1', '-timeout=60s', '-bench=.', '-benchtime=1x', './...'], directory));
    run(['vet', './...'], directory);
    console.log(`Compiled and exercised ${Object.keys(fixtures).length} exact Go cards plus 26 legacy compile fixtures; race tests, benchmark smoke runs and vet passed.`);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}
module.exports = { generate, run };
