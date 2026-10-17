// Offline, bounded checks. Never select commands from arbitrary catalog text.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pack = require('../packs/shellscript.json');
const marker = 'SYNTAXISER_RUNTIME_REPORT=';
let deadline = Infinity;

function run(command, args, options = {}) {
  return new Promise(resolve => {
    if (Date.now() >= deadline) return resolve({ exitCode: null, error: 'timeout', output: '' });
    const child = spawn(command, args, {
      cwd: options.cwd || root,
      env: { ...process.env, BASH_ENV: '/dev/null', ENV: '/dev/null', ...options.env },
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '', error;
    const kill = () => {
      try { process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {}
    };
    const timer = setTimeout(() => { error = 'timeout'; kill(); }, Math.min(options.timeout || 120_000, deadline - Date.now()));
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => {
      if (output.length + data.length > 2 * 1024 * 1024) { error = 'output limit'; kill(); }
      else output += data;
    });
    child.on('error', e => { error = e.code || e.message; });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      kill(); // Also stop descendants, even when the parent exits first.
      resolve({ exitCode, signal, error, output });
    });
  });
}
function passed(result) { assert.equal(result.error, undefined, result.output); assert.equal(result.exitCode, 0, result.output); }
function aggregate(families) {
  const required = families.filter(f => !f.optional);
  if (families.some(f => f.status === 'failed')) return 'failed';
  return required.some(f => f.status === 'unavailable') ? 'unavailable' : 'passed';
}
async function family(name, prerequisites, check, optional = false) {
  const tools = {};
  const missing = [];
  const broken = [];
  for (const [tool, args] of prerequisites) {
    const probe = await run(tool, args, { timeout: 5000 });
    tools[tool] = probe.error || probe.output.trim().split('\n')[0];
    if (probe.error && probe.error !== 'ENOENT') broken.push(tool + ': ' + probe.error);
    else if (probe.error || probe.exitCode !== 0) missing.push(tool);
  }
  if (broken.length) return { name, optional, status: 'failed', tools, reason: broken.join(', ') };
  if (missing.length) return { name, optional, status: 'unavailable', tools, reason: 'Missing prerequisites: ' + missing.join(', ') };
  try { return { name, optional, tools, ...await check(), status: 'passed' }; }
  catch (error) { return { name, optional, tools, status: error.unavailable ? 'unavailable' : 'failed', reason: error.message }; }
}
async function withScratch(check) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser shell space '));
  try { return await check(directory); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); assert.equal(fs.existsSync(directory), false); }
}
async function bashChecks() {
  return withScratch(async directory => {
    const env = { TMPDIR: directory };
    const tour = await run('bash', ['playground/shell/main.sh'], { env });
    passed(tour); assert.match(tour.output, /apple\npear/); assert.match(tour.output, /fruit\.txt: 3/); assert.match(tour.output, /Tour complete/);
    assert.deepEqual(fs.readdirSync(directory), [], 'Bash tour must clean its temporary files');
    const script = id => {
      const code = pack.cards.find(c => c.id === id)?.code;
      assert.equal(typeof code, 'string', 'Missing catalog card: ' + id);
      return code;
    };
    const bash = code => run('bash', ['--noprofile', '--norc', '-o', 'pipefail', '-c', code], { cwd: directory, env });
    // Only these inspected, local-only cards are executable in this runner.
    const quote = await bash(script('quoting'));
    passed(quote); assert.equal(quote.output, 'my project\n');
    fs.mkdirSync(path.join(directory, 'src'));
    fs.writeFileSync(path.join(directory, 'src', 'space name.rs'), '');
    const loop = await bash(script('loops'));
    passed(loop); assert.equal(loop.output, 'src/space name.rs\n');
    fs.unlinkSync(path.join(directory, 'src', 'space name.rs'));
    const emptyLoop = await bash(script('loops'));
    passed(emptyLoop); assert.equal(emptyLoop.output, '', 'Unmatched glob must be skipped');
    passed(await run('git', ['init', '--quiet'], { cwd: directory }));
    const emptyPipe = await bash(script('pipes'));
    passed(emptyPipe); assert.equal(emptyPipe.output, '');
    for (let i = 24; i >= 0; i--) fs.writeFileSync(path.join(directory, `file ${String(i).padStart(2, '0')}.txt`), '');
    passed(await run('git', ['add', '.'], { cwd: directory }));
    const pipe = await bash(script('pipes'));
    passed(pipe); assert.deepEqual(pipe.output.trim().split('\n'), Array.from({ length: 20 }, (_, i) => `file ${String(i).padStart(2, '0')}.txt`));
    fs.rmSync(path.join(directory, '.git'), { recursive: true });
    // Prevent Git discovering the user's repository above the disposable fixture.
    const failedPipe = await run('bash', ['-o', 'pipefail', '-c', script('pipes')], { cwd: directory, env: { ...env, GIT_CEILING_DIRECTORIES: path.dirname(directory) } });
    assert.notEqual(failedPipe.exitCode, 0); assert.match(failedPipe.output, /not a git repository/);
    // Independent boundary fixtures, not evidence for fixed-value catalog cards.
    const empty = await bash('value=""; printf "%s\\n" "$value"');
    passed(empty); assert.equal(empty.output, '\n');
    const failure = await run('bash', ['-euo', 'pipefail', '-c', 'scratch=$(mktemp -d); trap \'rm -rf "$scratch"\' EXIT; printf x > "$scratch/file"; false | cat; printf unreachable'], { env: { TMPDIR: directory } });
    assert.notEqual(failure.exitCode, 0); assert.doesNotMatch(failure.output, /unreachable/);
    assert.deepEqual(fs.readdirSync(directory).filter(n => !n.startsWith('file ') && n !== 'src'), [], 'Failure trap must clean up');
    return { assertions: ['quoting:happy', 'loops:happy,edge', 'pipes:happy,edge,error', 'fixture:empty-input,pipeline-failure,cleanup'] };
  });
}
async function nodeChecks() {
  const expectedNode = 'v' + fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
  const pnpm = await run('pnpm', ['--version']);
  if (process.version !== expectedNode || pnpm.output.trim() !== '11.21.0') throw Object.assign(Error(`Requires Node ${expectedNode} and pnpm 11.21.0; got ${process.version}, ${pnpm.output.trim()}`), { unavailable: true });
  const fixture = path.join(root, 'playground/shell/node-cli');
  const versions = {};
  for (const [name, version] of Object.entries(require(path.join(fixture, 'package.json')).devDependencies)) {
    const installed = path.join(fixture, 'node_modules', name, 'package.json');
    if (!fs.existsSync(installed) || JSON.parse(fs.readFileSync(installed)).version !== version) throw Object.assign(Error(`Install frozen Node fixture dependencies: ${name}@${version} unavailable`), { unavailable: true });
    versions[name] = version;
  }
  return withScratch(async directory => {
    fs.cpSync(fixture, directory, { recursive: true, filter: source => !['node_modules', 'dist'].includes(path.basename(source)) && !source.endsWith('.tsbuildinfo') });
    fs.symlinkSync(path.join(fixture, 'node_modules'), path.join(directory, 'node_modules'), 'dir');
    const tour = await run('bash', ['tour.sh'], { cwd: directory, timeout: 240_000, env: { pnpm_config_verify_deps_before_run: 'false' } });
    passed(tour); assert.match(tour.output, /Node CLI tour complete/);
    // Exact Node test card: passing tests, zero matches, and an actual failed test.
    const code = pack.cards.find(c => c.id === 'node-test').code;
    fs.writeFileSync(path.join(directory, 'test/math.test.mjs'), "import test from 'node:test'; import assert from 'node:assert/strict'; test('adds', () => assert.equal(2 + 3, 5));\n");
    const exact = () => run('bash', ['-euo', 'pipefail', '-c', code], { cwd: directory });
    passed(await exact());
    fs.writeFileSync(path.join(directory, 'test/math.test.mjs'), "import test from 'node:test'; test('other', () => console.log('OTHER_CALLBACK_RAN'));\n");
    const noMatch = await exact(); passed(noMatch); assert.equal((noMatch.output.match(/OTHER_CALLBACK_RAN/g) || []).length, 1); // No selected tests is not a failed test.
    fs.writeFileSync(path.join(directory, 'test/math.test.mjs'), "import test from 'node:test'; import assert from 'node:assert/strict'; test('adds', () => assert.equal(2 + 3, 6));\n");
    const rejected = await exact(); assert.notEqual(rejected.exitCode, 0); assert.match(rejected.output, /fail 1/);
    return { versions, assertions: ['node-test:happy,edge,error', 'node-cli:local-tour'], output: tour.output };
  });
}
async function awsChecks() {
  const version = await run('aws', ['--version']);
  if (!/aws-cli\/2\./.test(version.output)) throw Object.assign(Error('Offline tour requires AWS CLI v2: ' + version.output.trim()), { unavailable: true });
  const result = await run('bash', ['playground/shell/aws.sh']);
  passed(result); assert.match(result.output, /Offline tour complete/);
  return { assertions: ['aws:offline-model-tour-only'], output: result.output };
}
async function main() {
  deadline = Date.now() + 480_000;
  const families = [];
  families.push(await family('bash', [['bash', ['--version']], ['git', ['--version']], ...['mktemp', 'sort', 'uniq', 'find', 'wc', 'rm', 'cat', 'head'].map(t => [t, ['--version']])], bashChecks));
  families.push(await family('shell-depth', [['bash', ['--version']], ['zsh', ['--version']], ['jq', ['--version']]], () => require('./check-shell-depth.cjs').checkDepth()));
  families.push(await family('node-cli', [['bash', ['--version']], ['node', ['--version']], ['pnpm', ['--version']], ['npm', ['--version']]], nodeChecks));
  families.push(await family('aws', [['bash', ['--version']], ['aws', ['--version']]], awsChecks, true));
  const report = { schemaVersion: 1, status: aggregate(families), families };
  console.log(marker + JSON.stringify(report));
  process.exitCode = report.status === 'failed' ? 1 : report.status === 'unavailable' ? 2 : 0;
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { run, aggregate, family, withScratch, bashChecks, nodeChecks, main };
