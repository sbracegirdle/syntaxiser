const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const pack = require('../packs/rust.json');

// Parse fragments in async function bodies, allowing local declarations and await.
// rustfmt does not type-check illustrative symbols or require a Cargo project.
// Edition 2024 also parses let chains; those cards document their requirements.
const wrap = card => 'async fn card_' + card.id.replace(/-/g, '_') + '() {\n' + card.code + '\n}\n';
const input = pack.cards.map(wrap).join('\n');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-rust-'));
function check(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'], timeout: 15_000,
  });
  if (result.error) throw new Error(command + ': ' + result.error.message);
  if (result.status !== 0) throw new Error(result.stderr || command + ' exited with ' + result.status);
}
try {
  const file = path.join(scratch, 'cards.rs');
  fs.writeFileSync(file, input);
  check('rustfmt', [
    '--edition', '2024', '--config', 'skip_children=true', '--emit', 'stdout', file,
  ]);
  console.log('Rust syntax parsed successfully for all ' + pack.cards.length + ' cards.');
  if (process.argv.includes('--type-check-core')) {
    const cases = require('../test/fixtures/rust-core.json');
    const cards = cases.map(([, id]) => {
      const card = pack.cards.find(c => c.id === id);
      if (!card) throw new Error('Missing core card: ' + id);
      return card;
    });
    const coreFile = path.join(scratch, 'core.rs');
    fs.writeFileSync(coreFile, cards.map(wrap).join('\n'));
    // Metadata emission type-checks without linking native FFI symbols or running code.
    check('rustc', ['--edition', '2024', '--crate-type', 'lib', '--emit', 'metadata',
      '-A', 'warnings', '-o', path.join(scratch, 'core.rmeta'), coreFile]);
    console.log('Rust type checking passed for all ' + cards.length + ' core coverage cards.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
