const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { execFileSync } = require('node:child_process');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const original = Module._load;
const terminal = { processId: Promise.resolve(12345) };
Module._load = function(name, ...args) { return name === 'vscode' ? { window: { terminals: [terminal] } } : original.call(this, name, ...args); };
const { LiveTerminalContext, liveZshHook } = require('../out/terminalLive');
Module._load = original;
const { awsOperations } = require('../out/languages/shell');

test('Zsh redraw hook exports only known tools/subcommands, including empty input', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'syntaxiser-hook-test-'));
  try {
    const script = path.join(dir, 'hook.zsh');
    await fs.writeFile(script, liveZshHook(dir));
    const awsCases = Object.entries(awsOperations).flatMap(([service, operations]) => operations.map(operation =>
      [`aws ${service} ${operation} --resource secret`, `aws ${service} ${operation}`]));
    for (const [buffer, expected] of [['git', 'git'], ['git diff --token secret', 'git diff'], ['curl https://private.example', 'curl'], ['echo secret', ''], ['', ''],
      ['aws', 'aws'], ['aws s3', 'aws s3'],
      ['aws --profile private --region=ap-southeast-2 --no-cli-pager s3 sync /secret s3://private', 'aws s3 sync'],
      ['aws secretsmanager get-secret-value --secret-id secret', 'aws secretsmanager get-secret-value'],
      ['aws unknown secret', 'aws'], ['aws s3 private', 'aws s3'], ['aws --profile', 'aws'],
      ['aws --unknown secret s3 cp', 'aws'], ...awsCases]) {
      const result = execFileSync('zsh', ['-f', '-c', 'source "$1"; BUFFER="$2"; _syntaxiser_live_context; cat "$3/$$.cue"', 'test', script, buffer, dir], { encoding: 'utf8' });
      assert.equal(result, expected);
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('live bridge preserves user Zsh startup, reads bounded cues and cleans up', async () => {
  const saved = process.env.ZDOTDIR;
  const originalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'syntaxiser-user-zsh-'));
  await fs.writeFile(path.join(originalDir, '.zshenv'), 'export SYNTAXISER_ENV_TEST=preserved\n');
  await fs.writeFile(path.join(originalDir, '.zshrc'), 'export SYNTAXISER_RC_TEST=preserved\n');
  process.env.ZDOTDIR = originalDir;
  const changes = new Map();
  const environment = { persistent: true, replace: (key, value) => changes.set(key, value), delete: key => changes.delete(key) };
  const updates = [];
  const live = new LiveTerminalContext(environment, (t, text) => updates.push({ terminal: t, text }));
  let dir;
  try {
    await live.start();
    dir = changes.get('ZDOTDIR');
    assert.equal(environment.persistent, false);
    assert.equal((await fs.stat(dir)).mode & 0o777, 0o700);
    const startup = execFileSync('zsh', ['-i', '-c', 'print -r -- "$SYNTAXISER_ENV_TEST:$SYNTAXISER_RC_TEST:$ZDOTDIR"'], { env: { ...process.env, ZDOTDIR: dir }, encoding: 'utf8' });
    assert.equal(startup.trim(), `preserved:preserved:${originalDir}`);
    await fs.writeFile(path.join(dir, '12345.cue'), 'git diff --private secret');
    await delay(180);
    assert.equal(updates.at(-1).terminal, terminal);
    assert.equal(updates.at(-1).text, 'git diff');
    await fs.writeFile(path.join(dir, '12345.cue'), 'x'.repeat(101));
    await delay(180);
    assert.equal(updates.length, 1);
  } finally {
    live.dispose();
    if (saved === undefined) delete process.env.ZDOTDIR; else process.env.ZDOTDIR = saved;
    await fs.rm(originalDir, { recursive: true, force: true });
  }
  assert.equal(changes.has('ZDOTDIR'), false);
  await delay(30);
  await assert.rejects(fs.stat(dir), { code: 'ENOENT' });
});
