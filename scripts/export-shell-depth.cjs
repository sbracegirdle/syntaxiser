// Export a self-contained, exact-catalog playground for the primary checkout.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = process.argv[2] && path.resolve(process.argv[2]);
if (!target || target === root || fs.existsSync(target)) throw Error('Choose a new empty destination: node scripts/export-shell-depth.cjs /absolute/path');
fs.mkdirSync(target, { recursive: true });
for (const file of ['packs/shellscript.json','packs/shellscript-reference.json','playground/shell/depth.cjs',
  'playground/shell/depth-cases.json','scripts/check-shell-depth.cjs','scripts/check-shell-pack.cjs','docs/shell-depth.md']) {
  const dest = path.join(target, file); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(root, file), dest);
}
fs.mkdirSync(path.join(target, 'examples'));
const pack = require('../packs/shellscript.json');
const suite = require('../playground/shell/depth-cases.json');
const index = ['# Exact practical tasks', '', 'Run the fixture suite first. Each script is exact catalog text and needs the input/arguments below; Git scripts belong only in disposable repositories.', ''];
for (const entry of suite.cards) {
  const card = pack.cards.find(c => c.id === entry.id);
  fs.writeFileSync(path.join(target, 'examples', card.id + '.sh'), card.code + '\n');
  index.push('## ' + card.title, '', '`' + card.id + '.sh` — ' + entry.shells.join(', '), '', card.explanation, '',
    'Happy-path fixture: ' + JSON.stringify(entry.tests[0]), '');
}
fs.writeFileSync(path.join(target, 'examples', 'README.md'), index.join('\n'));
fs.writeFileSync(path.join(target, 'examples', 'cursor-probes.sh'), `# Cursor-only probes; do not run this file.
getopts :p: opt
while IFS= read -r line; do :; done
set -o pipefail
trap cleanup EXIT
awk -F, program data
jq -e filter input
git stash apply
git ls-files -u
git rebase --show-current-patch
echo 'literal; git rebase; jq'
cat <<'END'
git rebase
awk private
END
# getopts in a comment
alias jq='git stash'
`);
fs.writeFileSync(path.join(target, 'README.md'), '# Shell depth playground (#81)\n\nRun `node playground/shell/depth.cjs` from this directory, or `node ' + target + '/playground/shell/depth.cjs` from anywhere. Read docs/shell-depth.md for pinned system tools and manual acceptance. No Node packages are needed for this standalone suite; Node 26.3.0 and the documented system tools must already be installed. Examples are exact catalog code, not lessons. Do not run Git examples in the real checkout; the fixture suite constructs disposable repositories.\n');
console.log(target);
