const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { prepareLock } = require('./rust-library-lock.cjs');
const pack = require('../packs/rust.json');
const cases = require('../test/fixtures/rust-libraries/cases.json');
const fixture = path.resolve(__dirname, '../test/fixtures/rust-libraries');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-libraries-'));
const get = id => {
  const card = pack.cards.find(card => card.id === id);
  if (!card) throw new Error('Missing validation recipe: ' + id);
  return card.code;
};
const write = (file, text) => {
  const target = path.join(scratch, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
};
function cargo(args, cwd = scratch) {
  const result = spawnSync('cargo', args, {
    cwd, stdio: 'inherit', timeout: 600_000,
    env: { ...process.env, CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR || path.join(os.tmpdir(), 'syntaxiser-rust-library-target') },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('cargo ' + args.join(' ') + ' failed');
}
const updating = process.argv.includes('--update-lock');
function project(directory, args) {
  const lock = path.join(fixture, 'locks', directory + '.lock');
  prepareLock(lock, path.join(scratch, directory), { updating, offline: true, cargo });
  cargo([...args, '--locked', '--offline'], path.join(scratch, directory));
}
try {
  write('Cargo.toml', fs.readFileSync(path.join(fixture, 'Cargo.toml'), 'utf8'));
  const lock = path.join(fixture, 'Cargo.lock');
  write('derive/Cargo.toml', get('derive-macro-manifest'));
  write('derive/src/lib.rs', get('derive-macro-named'));
  let library = '#![allow(dead_code, unused_variables)]\n';
  for (const entry of cases) {
    const code = get(entry.id);
    if (entry.kind === 'item') library += code + '\n';
    else if (entry.kind === 'integration') write('tests/' + entry.id + '.rs', code);
    else if (entry.kind === 'bin') write('src/bin/' + entry.id + '.rs', code);
    else if (entry.kind === 'async') {
      // Compile the exact sidebar code, including non-running HTTP recipes.
      library += `${entry.run ? '#[tokio::test]\n' : ''}async fn ${entry.id.replaceAll('-', '_')}() -> anyhow::Result<()> {\n${code}\nOk(())\n}\n`;
    }
  }
  write('src/lib.rs', library);
  if (process.argv.includes('--lessons')) for (const [target, source] of [['lesson-outcomes', 'rust'], ['rust-foundations', 'rust-foundations']]) {
    write(`tests/${target}.rs`, fs.readFileSync(path.join(__dirname, `../playground/lessons/validation/${source}.rs`), 'utf8'));
  }
  prepareLock(lock, scratch, { updating, cargo });
  cargo(['check', '--workspace', '--all-targets', '--locked']);
  cargo(['test', '--workspace', '--locked']);
  for (const entry of cases.filter(c => c.kind === 'bin' && c.run)) cargo(['run', '--locked', '--bin', entry.id]);
  // Validate exact Cargo manifest recipes with the source layout described in the sidebar.
  write('package-recipe/Cargo.toml', get('cargo-features-layout'));
  write('package-recipe/src/lib.rs', 'pub fn answer() -> u32 { 42 }');
  write('package-recipe/src/main.rs', 'fn main() { assert_eq!(recipe_app::answer(), 42); }');
  write('workspace-recipe/Cargo.toml', get('cargo-workspace'));
  write('workspace-recipe/core/Cargo.toml', '[package]\nname="recipe-core"\nversion="0.1.0"\nedition="2024"\n');
  write('workspace-recipe/core/src/lib.rs', 'pub fn answer() -> u32 { 42 }');
  write('workspace-recipe/cli/Cargo.toml', '[package]\nname="recipe-cli"\nversion="0.1.0"\nedition="2024"\n[dependencies]\nrecipe-core={workspace=true}\n');
  write('workspace-recipe/cli/src/main.rs', 'fn main() { assert_eq!(recipe_core::answer(), 42); }');
  // Nested scratch projects are intentionally independent workspaces.
  fs.appendFileSync(path.join(scratch, 'package-recipe/Cargo.toml'), '\n[workspace]\n');
  project('package-recipe', ['check', '--features', 'json']);
  project('workspace-recipe', ['test', '--workspace']);
  for (const [framework, startup] of [['axum', 'axum-complete-startup'], ['actix', 'actix-complete-startup']]) {
    const directory = framework + '-recipe';
    write(directory + '/Cargo.toml', get(framework + '-startup-dependencies') + '\n[workspace]\n');
    write(directory + '/src/main.rs', get(startup));
    project(directory, ['check']);
  }
  console.log(`Validated ${cases.length} catalog recipes: exact Rust code, pinned dependencies, doctest, integration test, runnable binaries and Cargo layouts.`);
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
