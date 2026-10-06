const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const pack = require('../packs/rust.json');

// Parse fragments in async function bodies, allowing local declarations and await.
// rustfmt does not type-check illustrative symbols or require a Cargo project.
const input = pack.cards.map((card, index) =>
  'async fn card_' + index + '() {\n' + card.code + '\n}\n').join('\n');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-rust-'));
let result;
try {
  const file = path.join(scratch, 'cards.rs');
  fs.writeFileSync(file, input);
  result = spawnSync('rustfmt', [
    '--edition', '2021', '--config', 'skip_children=true', '--emit', 'stdout', file,
  ], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'], timeout: 15_000 });
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
if (result.error) {
  console.error('Rust snippet syntax check requires rustfmt:', result.error.message);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}
console.log('Rust syntax parsed successfully for all ' + pack.cards.length + ' cards.');
