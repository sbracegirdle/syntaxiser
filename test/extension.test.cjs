const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');

test('activation loads dedicated overviews alongside snippets before an editor is opened', async () => {
  const original = Module._load;
  let entries;
  const errors = [];
  const vscode = {
    Uri: { joinPath: (root, ...parts) => path.join(root, ...parts) },
    workspace: { fs: { readFile: file => fs.readFile(file) } },
    window: { registerWebviewViewProvider: () => ({}), showErrorMessage: text => errors.push(text) },
    commands: { registerCommand: () => ({}) },
  };
  Module._load = function(name, ...args) {
    if (name === 'vscode') return vscode;
    if (name === './controller') return { ReferenceController: class {
      constructor(root, values) { entries = values; this.sidebar = {}; }
    } };
    return original.call(this, name, ...args);
  };
  try {
    delete require.cache[require.resolve('../out/extension')];
    const { activate } = require('../out/extension');
    await activate({ extensionUri: path.resolve(__dirname, '..'), subscriptions: [] });
    assert.deepEqual(errors, []);
    assert.equal(entries[0].pack.referenceTopics.length, require('../packs/rust-reference.json').length);
    assert.equal(entries[0].pack.cards.length, require('../packs/rust.json').cards.length);
    assert.equal(entries[1].adapter.languageId, "go");
    assert.equal(entries[1].pack.languageId, "go");
    assert.equal(entries[1].pack.referenceTopics.length, 27);
    assert.equal(entries[1].pack.cards.length, 28);
    assert.equal(entries[2].adapter.languageId, 'shellscript');
    assert.equal(entries[2].pack.cards.length, require('../packs/shellscript.json').cards.length);
    assert.equal(entries[2].pack.referenceTopics.length, require('../packs/shellscript-reference.json').length);
    const typescript = entries.find(entry => entry.adapter.languageId === 'typescript');
    assert.deepEqual(typescript.adapter.aliases, ['typescriptreact']);
    assert.equal(typescript.pack.languageId, 'typescript');
    assert.equal(typescript.pack.referenceTopics.length, require('../packs/typescript-reference.json').length + 1);
    assert.equal(typescript.pack.cards.length, require('../packs/typescript.json').cards.length + 2);
    const python = entries.find(entry => entry.adapter.languageId === 'python');
    assert.equal(python.pack.languageId, 'python');
    assert.equal(python.pack.cards.length, require('../packs/python.json').cards.length + 2);
    assert.equal(python.pack.referenceTopics.length, require('../packs/python-reference.json').length + 1);
    assert.ok(python.pack.cards.some(card => card.id === 'python-sqlite3-client-find'));
    const javascript = entries.find(entry => entry.adapter.languageId === 'javascript');
    assert.deepEqual(javascript.adapter.aliases, ['javascriptreact']);
    assert.equal(javascript.pack.cards.length, require('../packs/javascript.json').cards.length);
    assert.equal(javascript.pack.referenceTopics.length, require('../packs/javascript-reference.json').length);
    for (const id of ['html', 'css', 'sql']) {
      const entry = entries.find(entry => entry.adapter.languageId === id);
      assert.equal(entry.pack.languageId, id);
      assert.equal(entry.pack.referenceTopics.length, require('../packs/' + id + '-reference.json').length);
    }
    const broken = { ...vscode.workspace.fs };
    vscode.workspace.fs.readFile = file => file.endsWith('rust-reference.json')
      ? Promise.resolve(Buffer.from('[{"id":"unknown"}]')) : broken.readFile(file);
    await activate({ extensionUri: path.resolve(__dirname, '..'), subscriptions: [] });
    assert.match(errors[0], /Invalid reference topic/);
  } finally {
    Module._load = original;
    delete require.cache[require.resolve('../out/extension')];
  }
});
