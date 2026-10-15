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
    assert.equal(entries[0].pack.referenceTopics.length, 83);
    assert.equal(entries[0].pack.cards.length, 211);
    assert.equal(entries[1].adapter.languageId, "go");
    assert.equal(entries[1].pack.languageId, "go");
    assert.equal(entries[1].pack.referenceTopics.length, 26);
    assert.equal(entries[1].pack.cards.length, 26);
    assert.equal(entries[2].adapter.languageId, 'shellscript');
    assert.equal(entries[2].pack.cards.length, 26);
    assert.equal(entries[2].pack.referenceTopics.length, 26);
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
