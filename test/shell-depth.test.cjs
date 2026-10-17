const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { shellCues, shellAdapter, maskShell } = require('../out/languages/shell');
const { Retriever } = require('../out/core/retrieval');
const { validatePack } = require('../out/core/pack');
const pack = require('../packs/shellscript.json');
const suite = require('../playground/shell/depth-cases.json');
const { checkDepth } = require('../scripts/check-shell-depth.cjs');
const retriever = new Retriever(validatePack({ ...pack, referenceTopics: require('../packs/shellscript-reference.json') }));
function context(text, offset = 0) { return shellAdapter.extract({ text, offset, symbols: [], recentEdits: [] }); }

test('shell depth searches and editor cursors surface practical tasks in the first three', () => {
  for (const { query, topic } of require('../coverage/languages.json').languages.shellscript.searches.slice(2)) {
    assert.ok(retriever.search(query, 3).some(r => r.card.topics.includes(topic)), query);
  }
  for (const [text, topic] of [['getopts :p: opt','shell-getopts'], ['set -o pipefail','shell-pipefail'],
    ['trap cleanup EXIT','shell-traps'], ['awk -F, private source','text-awk'], ['git ls-files -u secret','git-conflicts'],
    ['git rebase --show-current-patch','git-rebase'], ['values=(one two)','shell-arrays'],
    ['build() { local secret=value; return 2; }','shell-functions'], ['while IFS= read -r secret; do','shell-read'],
    ['jq -e private file','text-jq'], ['getopts :p:','shell-getopts']]) {
    assert.ok(retriever.relevant(context(text),3).some(r => r.card.topics.includes(topic)), text + ':' + shellCues(text));
  }
});

test('shell literal masking excludes comments, quotes, here-documents and misleading identifiers', () => {
  for (const text of ['echo "x; git rebase; jq"', "echo 'x; trap cleanup'", '# awk group total',
    "alias jq='git stash'", 'project_getopts=private', 'echo "incomplete; git stash', 'echo `git ls-files -u`',
    "cat <<'END'\ngit rebase\nawk private\nEND\n", 'cat <<-END\n\tgit stash\n\tEND\n']) {
    assert.equal(shellCues(text), '', text);
  }
  const document = "cat <<'END'\ngit rebase\nEND\ngetopts :p: opt";
  assert.equal(context(document,document.indexOf('git')).currentLine,'');
  assert.equal(context(document,document.indexOf('getopts')).currentLine,'getopts');
  const quoted = "echo 'first\ngit rebase\nlast'\njq -e filter input";
  assert.equal(context(quoted,quoted.indexOf('git')).currentLine,'');
  assert.equal(context(quoted,quoted.indexOf('jq')).currentLine,'jq');
  for (const source of [document,quoted,'echo "😀; git stash"\ngetopts :n: arg']) {
    assert.equal(maskShell(source).length,source.length);
    assert.deepEqual([...maskShell(source).matchAll(/\n/g)].map(m=>m.index),[...source.matchAll(/\n/g)].map(m=>m.index));
  }
  assert.equal(shellCues('if command git stash apply secret; then jq private; fi'), 'git stash\njq');
  assert.equal(shellCues('read -r secret # git rebase'),'read');
});

test('every new card executes happy, edge, rejection and reconstructed recovery fixtures', async () => {
  const result = await checkDepth();
  assert.equal(suite.cards.length,40);
  assert.equal(result.assertions.length,suite.cards.reduce((n,c)=>n+c.shells.length*4,0));
});

test('exact-card assertions detect meaningful catalog mutations', async () => {
  for (const [id, before, after] of [
    ['function-label','local value','value'], ['getopts-report','"$@"','$*'], ['filenames-glob','shopt -s nullglob','shopt -u nullglob'],
    ['pipefail-sort','set -o pipefail','set +o pipefail'], ['trap-workspace',`trap 'rm -rf -- "$scratch"' EXIT`,':'],
    ['substitution-preserve','cat message.txt &&','cat message.txt;'], ['awk-totals','if (!bad)','if (1)'],
    ['git-unstage','--staged','--worktree'], ['jq-total','add // 0','add'],
  ]) {
    const card=pack.cards.find(c=>c.id===id), original=card.code;
    assert.ok(original.includes(before),id);
    try { card.code=original.replace(before,after); await assert.rejects(checkDepth({skipVersions:true,ids:[id]}),undefined,id); }
    finally { card.code=original; }
  }
});

test('live Zsh hook recognizes safe shell and Git families without retaining operands', () => {
  const Module=require('node:module'), original=Module._load;
  Module._load=function(name,...args){return name==='vscode'?{}:original.call(this,name,...args)};
  let hook;try { hook=require('../out/terminalLive').liveZshHook; } finally {Module._load=original;}
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'syntaxiser-shell-depth-hook-'));
  try {
    const file=path.join(dir,'hook.zsh');fs.writeFileSync(file,hook(dir));
    for(const [source,expected] of [['getopts :p: private','getopts'], ['read -r private','read'], ['trap private EXIT','trap'],
      ['jq private secret','jq'], ['awk private secret','awk'], ['set -o pipefail','pipefail'],
      ['git restore --staged private','git restore'], ['git stash apply private','git stash'], ['git rebase private','git rebase']]) {
      const result=execFileSync('zsh',['-f','-c','source "$1"; BUFFER="$2"; _syntaxiser_live_context; cat "$3/$$.cue"','test',file,source,dir],{encoding:'utf8'});
      assert.equal(result,expected,source);assert.equal(shellCues(source),expected,source);
    }
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
