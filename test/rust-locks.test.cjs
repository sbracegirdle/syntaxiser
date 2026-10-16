const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { prepareLock } = require('../scripts/rust-library-lock.cjs');

const hasCargo = spawnSync('cargo', ['--version'], { encoding: 'utf8' }).status === 0;
test('validation retains an older lock with a newer locally cached version; update is explicit', { skip: !hasCargo }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-lock-regression-'));
  const write = (name, content) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  const cargo = (args, cwd) => {
    const result = spawnSync('cargo', args, {
      cwd, encoding: 'utf8', timeout: 30_000,
      env: { ...process.env, CARGO_HOME: path.join(root, 'cargo-home'), CARGO_TARGET_DIR: path.join(root, 'target') },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  };
  const cachedVersion = version => {
    write(`vendor/lock-probe-${version}/Cargo.toml`, `[package]\nname="lock-probe"\nversion="${version}"\nedition="2021"\n`);
    write(`vendor/lock-probe-${version}/src/lib.rs`, 'pub fn answer() -> u32 { 42 }');
    write(`vendor/lock-probe-${version}/.cargo-checksum.json`, '{"files":{},"package":null}');
  };
  try {
    // A directory source supplies cached registry packages without network or the user's Cargo cache.
    write('.cargo/config.toml', '[source.crates-io]\nreplace-with="cached"\n[source.cached]\ndirectory="vendor"\n');
    write('Cargo.toml', '[package]\nname="lock-consumer"\nversion="0.1.0"\nedition="2021"\n[dependencies]\nlock-probe="1"\n');
    write('src/lib.rs', '#[test]\nfn dependency_runs() { assert_eq!(lock_probe::answer(), 42); }');
    cachedVersion('1.0.0');
    cargo(['generate-lockfile', '--offline'], root);
    const older = fs.readFileSync(path.join(root, 'Cargo.lock'));
    cachedVersion('1.1.0');
    for (const name of ['combined', 'package-recipe', 'workspace-recipe', 'axum-recipe', 'actix-recipe']) {
      const committed = path.join(root, 'locks', name + '.lock');
      write('locks/' + name + '.lock', older);
      fs.rmSync(path.join(root, 'Cargo.lock'));
      prepareLock(committed, root, { cargo: () => assert.fail('normal validation must not resolve dependencies') });
      cargo(['test', '--locked', '--offline'], root);
      assert.deepEqual(fs.readFileSync(committed), older);
      assert.deepEqual(fs.readFileSync(path.join(root, 'Cargo.lock')), older);
    }
    const reviewed = path.join(root, 'locks', 'combined.lock');
    prepareLock(reviewed, root, { updating: true, offline: true, cargo });
    const updated = fs.readFileSync(reviewed, 'utf8');
    assert.match(updated, /name = "lock-probe"\nversion = "1\.1\.0"/);
    assert.notEqual(updated, older.toString());
    cargo(['test', '--locked', '--offline'], root);
    const missing = path.join(root, 'locks', 'missing.lock');
    assert.throws(() => prepareLock(missing, root, { cargo }), /Missing recipe lock.*--update-lock/);
    prepareLock(missing, root, { updating: true, offline: true, cargo });
    assert.equal(fs.readFileSync(missing, 'utf8'), updated);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the complete checker consumes committed locks for every workspace without regenerating', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-checker-regression-'));
  const repository = path.resolve(__dirname, '..');
  try {
    const preload = path.join(root, 'cargo.cjs');
    fs.writeFileSync(preload, `
      const assert = require('node:assert/strict');
      const fs = require('node:fs');
      const path = require('node:path');
      const fixture = ${JSON.stringify(path.join(repository, 'test/fixtures/rust-libraries'))};
      const visited = new Set();
      require('node:child_process').spawnSync = (command, args, options) => {
        assert.equal(command, 'cargo');
        assert.notEqual(args[0], 'generate-lockfile');
        assert.ok(args.includes('--locked'));
        const name = path.basename(options.cwd);
        const nested = name.endsWith('-recipe');
        const lock = path.join(fixture, nested ? 'locks/' + name + '.lock' : 'Cargo.lock');
        assert.deepEqual(fs.readFileSync(path.join(options.cwd, 'Cargo.lock')), fs.readFileSync(lock));
        visited.add(nested ? name : 'combined');
        return { status: 0 };
      };
      process.on('exit', () => assert.deepEqual([...visited].sort(), ['actix-recipe', 'axum-recipe', 'combined', 'package-recipe', 'workspace-recipe']));
    `);
    const result = spawnSync(process.execPath, ['--require', preload, path.join(repository, 'scripts/check-rust-libraries.cjs')], { encoding: 'utf8', timeout: 30_000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
