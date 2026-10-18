const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { planCleanup, shipped, worktrees } = require('../scripts/cleanup-shipped.cjs');

test('squash merges require the exact PR head and a merge commit on main', () => {
  const pr = { state: 'MERGED', baseRefName: 'main', headRefName: 'codex/shipped', headRefOid: 'head', mergeCommit: { oid: 'squash' } };
  const ancestor = oid => oid === 'squash';
  assert.equal(shipped('head', pr.headRefName, [pr], ancestor), true);
  assert.equal(shipped('local-extra-commit', pr.headRefName, [pr], ancestor), false);
  assert.equal(shipped('head', pr.headRefName, [pr], () => false), false);
  assert.equal(shipped('head', pr.headRefName, [{ ...pr, baseRefName: 'integration' }], ancestor), false);
  assert.equal(shipped('head', pr.headRefName, [pr, { ...pr, state: 'OPEN' }], ancestor), false);
});

test('cleanup preserves dirty, linked, locked, managed and protected worktrees and their branches', () => {
  const primary = '/repo with spaces';
  const tree = (name, extra = {}) => ({ path: `${primary}/.worktrees/${name}`, branch: `codex/${name}`, head: name, ...extra });
  const trees = [tree('primary', { path: primary, branch: 'main' }), tree('current'), tree('clean'), tree('dirty'),
    tree('linked'), tree('locked', { locked: true }), tree('managed', { path: '/managed/checkout' }),
    tree('integration', { branch: 'integration' }), tree('unmerged')];
  const plan = planCleanup({ trees, primary, current: trees[1].path,
    branches: trees.map(t => ({ name: t.branch, oid: t.head })), remoteBranches: [], prs: [],
    ancestor: oid => oid !== 'unmerged', dirty: p => p === trees[3].path, links: [`${trees[4].path}/playground`] });
  assert.deepEqual(plan.worktrees.map(t => t.head), ['clean']);
  assert.deepEqual(plan.localBranches.map(t => t.name), ['codex/clean']);
  assert.equal(plan.retained.length, 8);
});

test('remote and local heads are evaluated independently; unknown and advanced heads remain', () => {
  const pr = { state: 'MERGED', baseRefName: 'main', headRefName: 'codex/a', headRefOid: 'remote-head', mergeCommit: { oid: 'squash' } };
  const plan = planCleanup({ trees: [], primary: '/repo', current: '/repo', prs: [pr],
    branches: [{ name: 'codex/a', oid: 'local-extra' }, { name: 'codex/unknown', oid: 'unknown' }],
    remoteBranches: [{ name: 'codex/a', oid: 'remote-head' }, { name: 'main', oid: 'squash' }],
    ancestor: oid => oid === 'squash', dirty: () => false, links: [] });
  assert.deepEqual(plan.localBranches, []);
  assert.deepEqual(plan.remoteBranches, [{ name: 'codex/a', oid: 'remote-head' }]);
});

test('porcelain worktree parsing retains paths with spaces, detached and locked states', () => {
  assert.deepEqual(worktrees('worktree /repo with spaces\nHEAD a\nbranch refs/heads/main\n\nworktree /tmp/detached\nHEAD b\ndetached\nlocked maintenance\n'), [
    { path: '/repo with spaces', head: 'a', branch: 'main', locked: false },
    { path: '/tmp/detached', head: 'b', branch: undefined, locked: true }
  ]);
});

test('real cleanup archives ignored files and recoverable branch history, preserving dirty work', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'syntaxiser-cleanup-test-'));
  const repo = path.join(root, 'repo with spaces'), remote = path.join(root, 'remote.git');
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Cleanup test', GIT_AUTHOR_EMAIL: 'test@example.invalid', GIT_COMMITTER_NAME: 'Cleanup test', GIT_COMMITTER_EMAIL: 'test@example.invalid' };
  const run = (program, args, cwd = root) => execFileSync(program, args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const git = (...args) => run('git', args, repo);
  try {
    run('git', ['init', '--bare', remote]);
    run('git', ['init', '-b', 'main', repo]);
    fs.writeFileSync(path.join(repo, '.gitignore'), 'ignored.txt\n.worktrees/\n');
    fs.writeFileSync(path.join(repo, 'example.txt'), 'base\n');
    git('add', '.'); git('-c', 'commit.gpgsign=false', 'commit', '-m', 'base');
    git('remote', 'add', 'origin', remote); git('push', '-u', 'origin', 'main');
    const clean = path.join(repo, '.worktrees', 'shipped'), dirty = path.join(repo, '.worktrees', 'dirty');
    git('worktree', 'add', '-b', 'codex/shipped', clean);
    fs.writeFileSync(path.join(clean, 'example.txt'), 'shipped content\n');
    run('git', ['add', '.'], clean); run('git', ['-c', 'commit.gpgsign=false', 'commit', '-m', 'shipped'], clean);
    const head = run('git', ['rev-parse', 'HEAD'], clean);
    git('push', 'origin', 'codex/shipped');
    git('merge', '--squash', 'codex/shipped'); git('-c', 'commit.gpgsign=false', 'commit', '-m', 'squash'); git('push', 'origin', 'main');
    const merge = git('rev-parse', 'HEAD');
    git('worktree', 'add', '-b', 'codex/dirty', dirty);
    fs.writeFileSync(path.join(clean, 'ignored.txt'), 'recover this build output\n');
    fs.writeFileSync(path.join(dirty, 'untracked.txt'), 'keep this edit\n');
    const bin = path.join(root, 'bin'); fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, 'gh'), `#!/bin/sh\nprintf '%s' '${JSON.stringify([{state:'MERGED',baseRefName:'main',headRefName:'codex/shipped',headRefOid:head,mergeCommit:{oid:merge}}])}'\n`, { mode: 0o755 });
    env.PATH = `${bin}${path.delimiter}${env.PATH}`;
    const script = require.resolve('../scripts/cleanup-shipped.cjs');
    const invoke = (args) => run(process.execPath, ['-e', 'require(process.argv[1]).main(JSON.parse(process.argv[2]), process.argv[3])', script, JSON.stringify(args), path.join(root, 'archive')], repo);
    const plan = JSON.parse(invoke([]));
    assert.equal(plan.worktrees.length, 1);
    assert.ok(fs.existsSync(clean)); // Dry run did not delete anything.
    const result = JSON.parse(invoke(['--apply', '--delete-remote']));
    assert.equal(result.removedWorktrees, 1);
    assert.equal(result.deletedLocalBranches, 1);
    assert.equal(result.deletedRemoteBranches, 1);
    assert.equal(fs.existsSync(clean), false);
    assert.equal(fs.readFileSync(path.join(dirty, 'untracked.txt'), 'utf8'), 'keep this edit\n');
    assert.equal(git('ls-remote', '--heads', 'origin', 'codex/shipped'), '');
    const report = JSON.parse(fs.readFileSync(path.join(result.archive, 'report.json')));
    const unpacked = path.join(root, 'unpacked'); fs.mkdirSync(unpacked);
    run('tar', ['-xzf', report.removedWorktrees[0].archive, '-C', unpacked]);
    assert.equal(fs.readFileSync(path.join(unpacked, 'ignored.txt'), 'utf8'), 'recover this build output\n');
    git('fetch', path.join(result.archive, 'repository.bundle'), 'refs/heads/codex/shipped:refs/heads/recovered');
    assert.equal(git('show', 'recovered:example.txt'), 'shipped content');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
