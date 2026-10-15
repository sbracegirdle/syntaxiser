const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { shellAdapter, shellCues } = require('../out/languages/shell');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const pack = validatePack({ ...require('../packs/shellscript.json'), referenceTopics: require('../packs/shellscript-reference.json') });

test('terminal catalog has separate overviews and parseable POSIX examples for every topic', () => {
  assert.equal(pack.cards.length, 26);
  assert.equal(pack.referenceTopics.length, 26);
  for (const card of pack.cards) {
    assert.notEqual(card.code, pack.referenceTopics.find(t => t.id === card.id).syntax);
    execFileSync('bash', ['-n'], { input: card.code });
  }
});

test('shell context keeps known command cues without retaining paths, secrets, or output', () => {
  assert.equal(shellCues('TOKEN=secret cargo test private_test --token secret | tee /secret/path'), 'cargo test\ntee');
  assert.equal(shellCues('curl https://secret.example -H "Authorization: Bearer secret"'), 'curl');
  assert.equal(shellCues('echo "cargo test" # go test'), '');
  const context = shellAdapter.extract({ text: 'git status\ncargo test', offset: 16, symbols: [], recentEdits: [] });
  assert.equal(context.currentLine, 'cargo test');
  assert.equal(context.scope, 'block');
});

test('terminal tool context and natural language search retrieve the expected examples and overviews', () => {
  const retriever = new Retriever(pack);
  for (const [text, id] of [['cargo test','cargo-test'], ['go test','go-test'], ['pnpm exec tsc --noEmit','typescript'], ['git diff','git-status']]) {
    const context = shellAdapter.extract({ text, offset: 0, symbols: [], recentEdits: [] });
    assert.equal(retriever.relevant(context)[0].card.id, id);
    assert.equal(retriever.relevantTopics(context, 2)[0], id);
  }
  assert.equal(retriever.search('TypeScript')[0].card.id, 'typescript');
  assert.equal(retriever.search('find files')[0].card.id, 'find');
});
