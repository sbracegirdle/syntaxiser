#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

function command(program, args, cwd) {
  return execFileSync(program, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
}

function worktrees(text) {
  return text.trim().split('\n\n').filter(Boolean).map(block => {
    const fields = Object.fromEntries(block.split('\n').map(line => {
      const space = line.indexOf(' ');
      return space < 0 ? [line, true] : [line.slice(0, space), line.slice(space + 1)];
    }));
    return { path: fields.worktree, head: fields.HEAD, branch: fields.branch?.replace(/^refs\/heads\//, ''), locked: !!fields.locked };
  });
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function shipped(head, branch, prs, ancestor) {
  if (prs.some(pr => pr.state === 'OPEN' && pr.headRefName === branch)) return false;
  return ancestor(head) || prs.some(pr => pr.state === 'MERGED' && pr.baseRefName === 'main'
    && pr.headRefName === branch && pr.headRefOid === head && pr.mergeCommit?.oid && ancestor(pr.mergeCommit.oid));
}

// Inspect symlinks without following them or crawling dependency/build directories.
function linksUnder(root) {
  const links = [];
  const skip = new Set(['.git', '.worktrees', 'node_modules', 'target', '.venv', 'bin', 'obj', 'out']);
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isSymbolicLink()) links.push(path.resolve(directory, fs.readlinkSync(file)));
      else if (item.isDirectory() && !skip.has(item.name)) walk(file);
    }
  }
  walk(root);
  return links;
}

function planCleanup({ trees, branches, remoteBranches, prs, ancestor, primary, current, dirty, links }) {
  const protectedBranch = branch => !branch || ['main', 'master', 'integration'].includes(branch);
  const candidates = [], retained = [];
  for (const tree of trees) {
    let reason;
    if (tree.path === primary || tree.path === current || tree.locked) reason = 'primary, current or locked checkout';
    else if (!isWithin(path.join(primary, '.worktrees'), tree.path)) reason = 'outside legacy .worktrees (use Codex archive for managed worktrees)';
    else if (tree.branch && protectedBranch(tree.branch)) reason = 'protected branch';
    else if (!shipped(tree.head, tree.branch, prs, ancestor)) reason = 'unmerged, unknown or open PR';
    else if (dirty(tree.path)) reason = 'local changes or untracked files';
    else if (links.some(link => isWithin(tree.path, link))) reason = 'referenced by a playground or checkout symlink';
    if (reason) retained.push({ ...tree, reason });
    else candidates.push(tree);
  }
  const retainedBranches = new Set(trees.filter(t => !candidates.includes(t)).map(t => t.branch));
  const removable = entries => entries.filter(({ name, oid }) => !protectedBranch(name)
    && !retainedBranches.has(name) && shipped(oid, name, prs, ancestor));
  return { worktrees: candidates, localBranches: removable(branches), remoteBranches: removable(remoteBranches), retained };
}

function main(args, archiveRoot = path.join(os.homedir(), 'archive')) {
  const allowed = new Set(['--apply', '--delete-remote']);
  if (args.some(arg => !allowed.has(arg)) || (args.includes('--delete-remote') && !args.includes('--apply'))) {
    throw new Error('Usage: node scripts/cleanup-shipped.cjs [--apply [--delete-remote]]');
  }
  const current = command('git', ['rev-parse', '--show-toplevel']);
  const git = (...argv) => command('git', argv, current);
  // Fetch must succeed: never infer deletion from stale remote refs or a partial PR list.
  git('fetch', 'origin');
  const prs = JSON.parse(command('gh', ['pr', 'list', '--repo', 'sbracegirdle/syntaxiser', '--state', 'all', '--limit', '1000',
    '--json', 'number,state,headRefName,headRefOid,baseRefName,mergeCommit'], current));
  if (prs.length === 1000) throw new Error('PR list may be truncated; refusing cleanup.');
  const trees = worktrees(git('-c', 'core.quotePath=false', 'worktree', 'list', '--porcelain'));
  const primary = trees[0].path;
  const baseline = git('rev-parse', 'origin/main');
  const ancestor = oid => {
    try { git('merge-base', '--is-ancestor', oid, baseline); return true; } catch { return false; }
  };
  const refs = prefix => git('for-each-ref', '--format=%(refname) %(objectname)', prefix).split('\n').filter(Boolean)
    .map(line => { const [ref, oid] = line.split(' '); return { name: ref.slice(prefix.length + 1), oid }; });
  const branches = refs('refs/heads');
  const remoteBranches = refs('refs/remotes/origin').filter(b => b.name !== 'HEAD');
  const dirty = directory => !!command('git', ['status', '--porcelain', '--untracked-files=all'], directory);
  const links = trees.filter(tree => fs.existsSync(tree.path)).flatMap(tree => linksUnder(tree.path));
  const plan = planCleanup({ trees, branches, remoteBranches, prs, ancestor, primary, current, dirty, links });
  if (!args.includes('--apply')) { console.log(JSON.stringify({ baseline, ...plan }, null, 2)); return; }

  const archive = path.join(archiveRoot, `syntaxiser-cleanup-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(archive, { recursive: true, mode: 0o700 });
  const report = { baseline, ...plan, removedWorktrees: [], deletedLocalBranches: [], deletedRemoteBranches: [] };
  const save = () => fs.writeFileSync(path.join(archive, 'report.json'), JSON.stringify(report, null, 2));
  save();
  git('bundle', 'create', path.join(archive, 'repository.bundle'), '--all');
  git('bundle', 'verify', path.join(archive, 'repository.bundle'));
  for (const [index, tree] of plan.worktrees.entries()) {
    // Recheck mutable state immediately before archiving/removal. Never force removal.
    if (dirty(tree.path) || command('git', ['rev-parse', 'HEAD'], tree.path) !== tree.head) throw new Error(`Worktree changed: ${tree.path}`);
    const file = path.join(archive, `${index}-${path.basename(tree.path)}.tar.gz`);
    command('tar', ['-czf', file, '-C', tree.path, '.']);
    command('tar', ['-tzf', file]);
    git('worktree', 'remove', tree.path);
    report.removedWorktrees.push({ path: tree.path, archive: file }); save();
  }
  for (const branch of plan.localBranches) {
    const checkedOut = worktrees(git('-c', 'core.quotePath=false', 'worktree', 'list', '--porcelain'));
    if (checkedOut.some(tree => tree.branch === branch.name)) throw new Error(`Branch is now checked out: ${branch.name}`);
    // Compare-and-delete protects changes made after the plan was produced.
    git('update-ref', '-d', `refs/heads/${branch.name}`, branch.oid);
    report.deletedLocalBranches.push(branch); save();
  }
  if (args.includes('--delete-remote')) {
    for (const branch of plan.remoteBranches) {
      git('push', `--force-with-lease=refs/heads/${branch.name}:${branch.oid}`, 'origin', `:refs/heads/${branch.name}`);
      report.deletedRemoteBranches.push(branch); save();
    }
  }
  console.log(JSON.stringify({ archive, removedWorktrees: report.removedWorktrees.length,
    deletedLocalBranches: report.deletedLocalBranches.length, deletedRemoteBranches: report.deletedRemoteBranches.length }, null, 2));
}

module.exports = { worktrees, shipped, planCleanup, main };
if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
