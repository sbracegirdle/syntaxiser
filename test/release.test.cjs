const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseArgs, buildEnvironment, checkFiles, release, run, inspectVsix } = require('../scripts/release.cjs');

const files = ['package.json', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'out/extension.js',
  'media/sidebar.js', 'media/lessons.js', 'media/sidebar.css', 'media/highlight.js', 'media/reference.svg', 'packs/rust.json'].sort();

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const manifest = { publisher: 'syntaxiser', name: 'syntaxiser', version: '0.4.3' };
  const artifact = 'syntaxiser-0.4.3.vsix';
  const bytes = Buffer.from('reviewed package fixture');
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(root, '.nvmrc'), '26.3.0\n');
  fs.mkdirSync(path.join(root, 'packs'));
  fs.writeFileSync(path.join(root, 'packs/rust.json'), '{}');
  const directory = path.join(root, '.release');
  fs.mkdirSync(directory);
  fs.writeFileSync(path.join(directory, artifact), bytes);
  const receipt = { schema: 1, identity: 'syntaxiser.syntaxiser@0.4.3', artifact, sha256: hash, commit: 'abc123', files };
  const save = () => fs.writeFileSync(path.join(directory, 'release.json'), JSON.stringify(receipt));
  save();
  const calls = [];
  const state = { branch: 'main', commit: 'abc123', dirty: '', fail: '' };
  const execute = (command, args, options) => {
    calls.push({ command, args, options });
    const line = `${command} ${args.join(' ')}`;
    if (state.fail && line.includes(state.fail)) throw Error('synthetic check failure');
    if (command === 'git') {
      if (args[0] === 'status') return state.dirty;
      if (args[0] === 'branch') return state.branch;
      return state.commit;
    }
    if (line === 'node --version') return 'v26.3.0';
    if (line === 'pnpm --version') return '11.21.0';
    if (args.includes('package')) fs.writeFileSync(path.join(directory, artifact), bytes);
    return '';
  };
  const options = { command: 'publish', confirm: receipt.identity, sha256: hash, auth: 'pat' };
  const context = { root, env: { VSCE_PAT: 'synthetic-secret' }, execute, inspect: async () => ({ files, manifest }) };
  return { root, directory, receipt, save, state, calls, options, context };
}

test('release CLI defaults to no upload and accepts no arbitrary vsce arguments', () => {
  assert.deepEqual(parseArgs(['prepare']), { command: 'prepare', auth: 'pat' });
  for (const args of [[], ['publish'], ['prepare', '--auth', 'pat'], ['publish', '--pat', 'secret'],
    ['publish', '--confirm', 'syntaxiser.syntaxiser@0.4.3'], ['publish', '--sha256', 'bad'],
    ['publish', '--confirm', 'x', '--sha256', 'a'.repeat(64), '--force', 'yes']]) {
    assert.throws(() => parseArgs(args));
  }
  assert.equal(parseArgs(['publish', '--confirm', 'x', '--sha256', 'a'.repeat(64), '--auth', 'azure']).auth, 'azure');
});

test('preparation subprocesses do not inherit publishing credentials', () => {
  assert.deepEqual(buildEnvironment({ PATH: '/bin', VSCE_PAT: 'secret', AZURE_CLIENT_SECRET: 'secret', GH_TOKEN: 'secret',
    GITHUB_TOKEN: 'secret', NODE_OPTIONS: '--require bad', NPM_TOKEN: 'secret' }), { PATH: '/bin' });
});

test('VSIX policy rejects credentials, development files, traversal, duplicates and missing runtime assets', () => {
  checkFiles(files);
  checkFiles(files.map(file => file === 'README.md' ? 'readme.md' : file === 'LICENSE' ? 'LICENSE.txt' : file).concat('packs/reference-pack.schema.json'));
  for (const extra of ['.env', '.env.production', '.worktrees/private.txt', '.release/release.json',
    'node_modules/keytar/index.js', 'pnpm-lock.yaml', 'scripts/release.cjs', 'out/../secret.js', 'media/token.txt']) {
    assert.throws(() => checkFiles([...files, extra]), /Unexpected package file/);
  }
  assert.throws(() => checkFiles([...files, files[0]]), /Duplicate/);
  assert.throws(() => checkFiles([...files, 'readme.md']), /Duplicate/);
  assert.throws(() => checkFiles(files.filter(file => file !== 'media/highlight.js')), /missing/);
});

test('preparation runs required checks, removes stale output and never uploads', async t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'out'));
  fs.writeFileSync(path.join(f.root, 'out/stale.js'), 'stale');
  const receipt = await release({ command: 'prepare' }, f.context);
  assert.equal(receipt.sha256, f.options.sha256);
  assert.equal(fs.existsSync(path.join(f.root, 'out/stale.js')), false);
  const commands = f.calls.map(call => `${call.command} ${call.args.join(' ')}`);
  for (const required of ['pnpm install --frozen-lockfile --ignore-scripts', 'pnpm test',
    'pnpm audit:coverage --check', 'node scripts/lesson-coverage.cjs --check']) assert.ok(commands.includes(required));
  assert.equal(f.calls.some(call => call.args.includes('publish')), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.directory, 'release.json'))).commit, 'abc123');
});

test('a failed preparation invalidates earlier evidence', async t => {
  const f = fixture(t);
  f.state.fail = 'pnpm test';
  await assert.rejects(release({ command: 'prepare' }, f.context), /check failure/);
  assert.equal(fs.existsSync(path.join(f.directory, 'release.json')), false);
  assert.equal(f.calls.some(call => call.args.includes('publish')), false);
});

test('only the reviewed artifact is passed to upload; credentials never enter argv', async t => {
  const f = fixture(t);
  await release(f.options, f.context);
  const uploads = f.calls.filter(call => call.args.includes('publish'));
  assert.equal(uploads.length, 1);
  assert.deepEqual(uploads[0].args, ['exec', 'vsce', 'publish', '--packagePath', path.join(f.directory, f.receipt.artifact)]);
  assert.deepEqual(uploads[0].options, { publishing: true });
  assert.equal(JSON.stringify(f.calls).includes('synthetic-secret'), false);
  assert.equal(f.calls.some(call => call.args.includes('package') || call.args.includes('install')), false);
});

test('publishing guards reject dirty/other source, wrong identity/checksum and changed bytes before upload', async t => {
  for (const mutate of [
    f => { f.state.dirty = ' M package.json'; },
    f => { f.state.branch = 'integration'; },
    f => { f.state.commit = 'different'; },
    f => { f.options.confirm = 'other.extension@0.4.3'; },
    f => { f.options.sha256 = '0'.repeat(64); },
    f => { fs.appendFileSync(path.join(f.directory, f.receipt.artifact), 'tampered'); },
    f => { f.receipt.files = []; f.save(); },
    f => { f.receipt.identity = 'other.extension@0.4.3'; f.save(); },
    f => { f.context.env = {}; },
    f => { f.options.auth = 'azure'; },
  ]) {
    const f = fixture(t);
    mutate(f);
    await assert.rejects(release(f.options, f.context));
    assert.equal(f.calls.some(call => call.args.includes('publish')), false);
  }
});

test('Azure mode explicitly opts in and refuses mixed PAT authentication', async t => {
  const f = fixture(t);
  f.options.auth = 'azure';
  f.context.env = {};
  await release(f.options, f.context);
  assert.ok(f.calls.find(call => call.args.includes('publish')).args.includes('--azure-credential'));
});

test('publishing errors suppress sensitive child output', () => {
  assert.throws(() => run(process.cwd(), process.execPath,
    ['-e', 'console.error("synthetic-secret"); process.exit(1)'], { publishing: true }),
  error => /upload failed/.test(error.message) && !error.message.includes('synthetic-secret'));
});

test('malformed VSIX files reject without hanging', async t => {
  const f = fixture(t);
  await assert.rejects(inspectVsix(path.join(f.directory, f.receipt.artifact)));
});
