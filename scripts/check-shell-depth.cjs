// Execute only the inspected card IDs in depth-cases.json, in disposable workspaces.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { run, withScratch } = require('./check-shell-pack.cjs');
const root = path.resolve(__dirname, '..');
const pack = require('../packs/shellscript.json');
const suite = require('../playground/shell/depth-cases.json');
const pins = { bash: '5.2.21', zsh: '5.9', git: '2.43.0', jq: '1.7', node: 'v26.3.0' };
async function versions() {
  const found = {};
  for (const [tool, version] of Object.entries(pins)) {
    const probe = await run(tool, ['--version'], { timeout: 5000 });
    if (probe.error || probe.exitCode !== 0 || !probe.output.includes(version)) {
      throw Object.assign(Error(`Requires ${tool} ${version}; got ${probe.error || probe.output}`), { unavailable: true });
    }
    found[tool] = probe.output.split('\n')[0];
  }
  for (const tool of ['find','xargs','sort','uniq','cut','sed','awk','grep','mktemp','sh']) {
    const probe = await run('sh', ['-c', 'command -v "$1"', 'probe', tool]);
    assert.equal(probe.exitCode, 0, `Missing ${tool}`);
    if (tool === 'sh') { const version = await run('dpkg-query', ['-W', '-f=${Version}', 'dash']);
      if (version.exitCode !== 0 || version.output.trim() !== '0.5.12-6ubuntu5') throw Object.assign(Error('Requires dash 0.5.12-6ubuntu5'), { unavailable: true });
      found.sh = 'dash ' + version.output.trim(); continue; }
    const detail = await run(tool, [tool === 'awk' ? '-W' : '--version', ...(tool === 'awk' ? ['version'] : [])]);
    found[tool] = detail.output.split('\n')[0] || probe.output.trim();
    const expected = { find: '4.9.0', xargs: '4.9.0', sort: '9.4', uniq: '9.4', cut: '9.4', sed: '4.9', awk: '1.3.4 20240123', grep: '3.11', mktemp: '9.4' }[tool];
    if (detail.exitCode !== 0 || !found[tool].includes(expected)) throw Object.assign(Error('Requires ' + tool + ' ' + expected + '; got ' + found[tool]), { unavailable: true });
  }
  return found;
}
async function prepareGit(directory, mode, env) {
  const git = async (...args) => {
    const r = await run('git', args, { cwd: directory, env });
    assert.equal(r.exitCode, 0, r.output); return r;
  };
  await git('init', '-q', '-b', 'main');
  await git('config', 'user.name', 'Syntaxiser fixture');
  await git('config', 'user.email', 'fixture@example.invalid');
  await git('config', 'commit.gpgsign', 'false');
  if (mode === 'unborn') return;
  fs.writeFileSync(path.join(directory, 'note.txt'), 'base\n');
  await git('add', 'note.txt'); await git('commit', '-qm', 'base');
  if (['base', 'staged'].includes(mode)) return;
  if (mode.startsWith('stash')) {
    fs.writeFileSync(path.join(directory, 'note.txt'), 'draft\n');
    await git('stash', 'push', '-qm', 'draft');
    if (mode === 'stash-conflict') {
      fs.writeFileSync(path.join(directory, 'note.txt'), 'other\n');
      await git('commit', '-qam', 'other');
    }
    return;
  }
  await git('switch', '-qc', 'feature');
  const deleting = ['delete-conflict','rebase-delete'].includes(mode);
  if (deleting && mode === 'delete-conflict') await git('rm', '-q', 'note.txt');
  else fs.writeFileSync(path.join(directory, 'note.txt'), 'theirs\n');
  await git('commit', '-qam', deleting && mode === 'delete-conflict' ? 'delete' : 'theirs');
  await git('switch', '-q', 'main');
  if (mode === 'rebase-delete') await git('rm', '-q', 'note.txt');
  else fs.writeFileSync(path.join(directory, 'note.txt'), 'ours\n');
  await git('commit', '-qam', mode === 'rebase-delete' ? 'delete' : 'ours');
  let conflict;
  if (mode.startsWith('rebase')) {
    await git('switch', '-q', 'feature');
    conflict = await run('git', ['rebase', 'main'], { cwd: directory, env });
  } else conflict = await run('git', ['merge', 'feature'], { cwd: directory, env });
  assert.equal(conflict.exitCode, 1, conflict.output);
}
async function scenario(directory, card, shell, spec) {
  // Each situation starts from an explicit fixture, including recovery after rejection.
  fs.mkdirSync(directory, { recursive: true });
  for (const entry of fs.readdirSync(directory)) fs.rmSync(path.join(directory, entry), { recursive: true, force: true });
  const temp = path.join(path.dirname(directory), '.tmp');
  fs.rmSync(temp, { recursive: true, force: true }); fs.mkdirSync(temp);
  const env = { LC_ALL: 'C', TMPDIR: temp, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CEILING_DIRECTORIES: path.dirname(directory), GIT_TERMINAL_PROMPT: '0', GIT_EDITOR: 'true', GIT_SEQUENCE_EDITOR: 'true',
    ...spec.env };
  if (spec.git) await prepareGit(directory, spec.git, env);
  for (const [name, contents] of Object.entries(spec.files || {})) {
    const target = path.join(directory, name);
    if (name.endsWith('/')) fs.mkdirSync(target, { recursive: true });
    else { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, contents); }
  }
  for (const name of spec.remove || []) fs.rmSync(path.join(directory, name), { recursive: true, force: true });
  if (spec.git === 'staged') {
    const added = await run('git', ['add', '--', 'note.txt'], { cwd: directory, env }); assert.equal(added.exitCode, 0, added.output);
  }
  // Separate stderr from stdout via explicit files; the shared runner bounds both output and time.
  const stdout = path.join(temp, 'stdout'), stderr = path.join(temp, 'stderr');
  const script = path.join(temp, 'exact.sh'); fs.writeFileSync(script, card.code + '\n');
  const parsed = await run(shell, [shell === 'zsh' ? '-f' : '-n', ...(shell === 'zsh' ? ['-n'] : []), script], { cwd: directory, env });
  assert.equal(parsed.exitCode, 0, `${card.id} ${shell} parse: ${parsed.output}`);
  const args = shell === 'bash' ? ['--noprofile','--norc'] : shell === 'zsh' ? ['-f'] : [];
  const launched = await run('sh', ['-c', '"$@" > "$OUT" 2> "$ERR"', 'launch', shell, ...args, script, ...(spec.args || [])], {
    cwd: directory, env: { ...env, OUT: stdout, ERR: stderr }, timeout: 10000,
  });
  const out = fs.existsSync(stdout) ? fs.readFileSync(stdout, 'utf8') : launched.output;
  const err = fs.existsSync(stderr) ? fs.readFileSync(stderr, 'utf8') : '';
  const label = `${card.id}/${shell}/${spec.kind}`;
  assert.equal(launched.error, undefined, label);
  assert.equal(launched.exitCode, spec.status, label + ': ' + err);
  assert.equal(out, spec.out.replaceAll('$DIR', directory), label + ' stdout');
  if (spec.err !== undefined) assert.equal(err, spec.err, label + ' stderr');
  else if (spec.errMatch) assert.match(err, new RegExp(spec.errMatch), label + ' diagnostic');
  else assert.equal(err, '', label + ' unexpected stderr');
  for (const [name, text] of Object.entries(spec.after || {})) assert.equal(fs.readFileSync(path.join(directory, name), 'utf8'), text, label + ' ' + name);
  for (const name of spec.absent || []) assert.equal(fs.existsSync(path.join(directory,name)), false, label + ' absent ' + name);
  for (const [name, pattern] of Object.entries(spec.fileMatch || {})) assert.match(fs.readFileSync(path.join(directory,name),'utf8'), new RegExp(pattern), label + ' ' + name);
  if (spec.gitCheck) {
    const git = async (...args) => { const r = await run('git',args,{cwd:directory,env}); assert.equal(r.exitCode,0,r.output); return r.output; };
    if (spec.gitCheck === 'clean') assert.equal(await git('status','--porcelain'), '', label + ' clean');
    if (spec.gitCheck === 'unstaged') assert.equal(await git('diff','--cached','--name-only'), '', label + ' index');
    if (spec.gitCheck.includes('stash')) assert.match(await git('stash','list'), /draft/, label + ' recovery stash');
    if (spec.gitCheck === 'conflicted-stash') assert.match(await git('ls-files','-u'), /note.txt/, label + ' unmerged');
  }
  // Only runner files remain in TMPDIR: every catalog-created workspace must be removed.
  assert.deepEqual(fs.readdirSync(temp).sort(), ['exact.sh','stderr','stdout'], label + ' temporary cleanup');
  return label;
}
async function checkDepth(options = {}) {
  const tools = options.skipVersions ? {} : await versions();
  const assertions = [];
  for (const entry of suite.cards) {
    if (options.ids && !options.ids.includes(entry.id)) continue;
    const card = pack.cards.find(c => c.id === entry.id); assert.ok(card, entry.id);
    assert.deepEqual(entry.tests.map(t => t.kind), ['happy','edge','error'], entry.id);
    for (const shell of entry.shells) {
      await withScratch(async scratch => {
        const directory = path.join(scratch, "work");
        for (const spec of entry.tests) assertions.push(await scenario(directory, card, shell, spec));
        // Recreate valid local inputs/repository after rejection and assert the original task works.
        assertions.push((await scenario(directory, card, shell, entry.tests[0])) + '/recovery');
      });
    }
  }
  return { tools, assertions };
}
if (require.main === module) checkDepth().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error); process.exitCode = error.unavailable ? 2 : 1; });
module.exports = { checkDepth, versions };
