// Generate every library package from exact catalog text, then test real dependencies.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = path.join(root, 'playground/go/libraries');
const cards = require('../packs/go.json').cards.filter(c => c.topics.some(t => ['gin','chi','testify'].includes(t)));
const prepare = process.argv.slice(2);
if (prepare.some(arg => arg !== '--prepare') || prepare.length > 1) throw Error('Usage: check-go-libraries.cjs [--prepare]');
const output = prepare.length ? path.join(fixture, 'generated') : fs.mkdtempSync(path.join(fixture, '.catalog-'));
function run(command, args) {
  const r = spawnSync(command, args, {cwd: output, stdio:'inherit', timeout: 240_000, env:{...process.env, GOTOOLCHAIN:'local', GOFLAGS:'-mod=readonly'}});
  if (r.error) throw r.error;
  if (r.status !== 0) throw Error(`${command} ${args.join(' ')} exited ${r.status}`);
}
try {
  fs.mkdirSync(output, {recursive:true});
  for (const name of ['go.mod','go.sum']) fs.copyFileSync(path.join(fixture,name),path.join(output,name));
  const ids = new Set(cards.map(c => c.id));
  const tests = fs.readdirSync(path.join(fixture,'fixtures')).filter(f => f.endsWith('_test.go'));
  if (tests.length !== cards.length || tests.some(f => !ids.has(f.slice(0,-8)))) throw Error('Every library card needs exactly one independent fixture');
  for (const card of cards) {
    const dir = path.join(output,card.id);
    fs.mkdirSync(dir, {recursive:true});
    fs.writeFileSync(path.join(dir, card.topics[0] === 'testify' ? 'catalog_test.go' : 'catalog.go'), card.code+'\n');
    fs.copyFileSync(path.join(fixture,'fixtures',card.id+'_test.go'),path.join(dir,'behavior_test.go'));
  }
  if (prepare.length) console.log(`Prepared ${cards.length} exact catalog packages in ${output}; run go test -race ./... and go vet ./... there.`);
  else {
    run('go', ['test','-race','-count=1','-timeout=60s','./...']);
    run('go', ['vet','./...']);
    console.log(`Compiled and asserted ${cards.length} exact Go library cards; race checks and vet passed.`);
  }
} finally {
  if (!prepare.length) fs.rmSync(output, {recursive:true,force:true});
}
