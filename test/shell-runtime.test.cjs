const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { aggregate, family, run, withScratch, bashChecks } = require('../scripts/check-shell-pack.cjs');
const { summarize } = require('../scripts/run-coverage-checks.cjs');
const families = statuses => [statuses[0], 'passed', ...statuses.slice(1)].map((status, i) => ({ name: ['bash', 'shell-depth', 'node-cli', 'aws'][i], optional: i === 3, status }));
const result = (statuses, exit) => ({ status: exit, stdout: 'pnpm preamble\nSYNTAXISER_RUNTIME_REPORT=' + JSON.stringify({ status: aggregate(families(statuses)), families: families(statuses) }) + '\n' });

test('runtime preserves early failures, unavailable prerequisites and optional AWS results', () => {
  for (const [statuses, exit, expected] of [
    [['failed','passed','passed'],1,'failed'],
    [['unavailable','passed','unavailable'],2,'unavailable'],
    [['passed','passed','unavailable'],0,'passed'],
    [['passed','passed','failed'],1,'failed'],
  ]) {
    const report = summarize('check:shell', result(statuses, exit));
    assert.equal(report.status, expected);
    assert.deepEqual(report.families, families(statuses));
  }
  assert.equal(summarize('check:shell', result(['passed','passed','passed'], 2)).status, 'failed');
  assert.equal(summarize('check:shell', { status: 0, stdout: 'no report' }).status, 'failed');
  assert.equal(summarize('check:shell', { ...result(['passed','passed','passed'],0), error: Error('timeout') }).status, 'failed');
  assert.equal(summarize('check:go', { status: 2 }).status, 'failed');
});

test('a missing tool is unavailable and never executes the family checks', async () => {
  const report = await family('missing', [['syntaxiser-nonexistent-tool', ['--version']]], () => assert.fail('must not run'));
  assert.equal(report.status, 'unavailable');
  assert.equal(report.tools['syntaxiser-nonexistent-tool'], 'ENOENT');
  const failure = await family('assertion', [], () => assert.fail('expected assertion'));
  assert.equal(failure.status, 'failed');
});

test('commands time out and failed checks still clean disposable paths containing spaces', async () => {
  const timed = await run(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout: 100 });
  assert.equal(timed.error, 'timeout');
  assert.notEqual(timed.exitCode, 0);
  let directory;
  await assert.rejects(withScratch(async scratch => {
    directory = scratch;
    fs.writeFileSync(path.join(scratch, 'temporary file'), 'test');
    throw Error('failure');
  }), /failure/);
  assert.equal(fs.existsSync(directory), false);
});

test('offline Bash assertions execute exact catalog code, empty globs and failed pipelines', async () => {
  const result = await bashChecks();
  assert.ok(result.assertions.includes('pipes:happy,edge,error'));
});

test('a catalog-only quoting regression fails the exact-code assertion', async () => {
  const card = require('../packs/shellscript.json').cards.find(c => c.id === 'quoting');
  const original = card.code;
  try {
    card.code = card.code.replace('"$project"', '$project');
    await assert.rejects(bashChecks(), /my project|actual|expected/i);
  } finally { card.code = original; }
});

test('the runtime CLI invokes the registered shell package command and exposes family details', async () => {
  await withScratch(async directory => {
    const fixture = result(['passed','passed','unavailable'], 0).stdout;
    const executable = path.join(directory, 'pnpm');
    fs.writeFileSync(executable, '#!' + process.execPath + '\n' +
      'require("node:fs").writeFileSync(' + JSON.stringify(path.join(directory, 'args')) + ', JSON.stringify(process.argv.slice(2)));\n' +
      'console.log(' + JSON.stringify(fixture) + ');\n');
    fs.chmodSync(executable, 0o755);
    const child = require('node:child_process').spawnSync(process.execPath, ['scripts/run-coverage-checks.cjs', 'shellscript'], {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', env: { ...process.env, PATH: directory + path.delimiter + process.env.PATH },
    });
    assert.equal(child.status, 0, child.stderr);
    const report = JSON.parse(child.stdout).languages[0];
    assert.equal(report.command, 'check:shell');
    assert.equal(report.status, 'passed');
    assert.deepEqual(report.families, families(['passed','passed','unavailable']));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'args'))), ['--config.verify-deps-before-run=false', 'run', 'check:shell']);
  });
});

 test('a required depth-family failure remains failed even when all retained families pass', () => {
 const detail = { status: 'failed', families: families(['passed','passed','passed']) };
 detail.families[1].status = 'failed';
 const report = summarize('check:shell', { status: 1, stdout: 'SYNTAXISER_RUNTIME_REPORT=' + JSON.stringify(detail) });
 assert.equal(report.status, 'failed');
 assert.equal(report.families[1].name, 'shell-depth');
 });
