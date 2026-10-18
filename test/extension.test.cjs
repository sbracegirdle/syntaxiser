const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');

test('activation loads catalogs and keeps public language documentation synchronized', async () => {
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
    // Public coverage must follow the adapters actually loaded by activation.
    const { JSDOM } = require('jsdom');
    const root = path.resolve(__dirname, '..');
    const site = new JSDOM(await fs.readFile(path.join(root, 'website/index.html'), 'utf8'));
    const listed = [...site.window.document.querySelectorAll('.language-strip li')];
    assert.deepEqual(listed.map(node => node.dataset.language).sort(),
      entries.map(entry => entry.adapter.languageId).sort(), 'landing page must list every active catalog exactly once');
    const readme = (await fs.readFile(path.join(root, 'README.md'), 'utf8'))
      .split('## Supported languages and tools\n')[1].split('\n## ')[0];
    const guide = await fs.readFile(path.join(root, 'docs/language-support.md'), 'utf8');
    assert.deepEqual([...readme.matchAll(/^- \*\*([^*]+)\*\*/gm)].map(match => match[1]).sort(),
      listed.map(node => node.textContent).sort(), 'README must list the same languages as the landing page');
    assert.deepEqual([...guide.matchAll(/^## (.+)$/gm)].map(match => match[1]).sort(),
      listed.map(node => node.textContent).sort(), 'support guide must document every listed language');
    for (const node of listed) {
      const entry = entries.find(entry => entry.adapter.languageId === node.dataset.language);
      assert.ok(node.textContent.toLowerCase().includes(entry.pack.displayName.toLowerCase()),
        'visible language label must name the loaded catalog: ' + entry.pack.displayName);
    }
    site.window.close();
    assert.equal(entries[0].pack.referenceTopics.length, require('../packs/rust-reference.json').length);
    assert.equal(entries[0].pack.cards.length, require('../packs/rust.json').cards.length);
    assert.equal(entries[1].adapter.languageId, "go");
    assert.equal(entries[1].pack.languageId, "go");
    assert.equal(entries[1].pack.referenceTopics.length, require("../packs/go-reference.json").length + 1);
    assert.equal(entries[1].pack.cards.length, require("../packs/go.json").cards.length + require('../packs/sql-companions.json').go.cards.length);
    assert.equal(entries[2].adapter.languageId, 'shellscript');
    assert.equal(entries[2].pack.cards.length, require('../packs/shellscript.json').cards.length);
    assert.equal(entries[2].pack.referenceTopics.length, require('../packs/shellscript-reference.json').length);
    const typescript = entries.find(entry => entry.adapter.languageId === 'typescript');
    assert.deepEqual(typescript.adapter.aliases, ['typescriptreact']);
    assert.equal(typescript.pack.languageId, 'typescript');
    assert.equal(typescript.pack.referenceTopics.length, require('../packs/typescript-reference.json').length + 1);
    assert.equal(typescript.pack.cards.length, require('../packs/typescript.json').cards.length + require('../packs/sql-companions.json').typescript.cards.length);
    const python = entries.find(entry => entry.adapter.languageId === 'python');
    assert.equal(python.pack.languageId, 'python');
    assert.equal(python.pack.cards.length, require('../packs/python.json').cards.length + require('../packs/sql-companions.json').python.cards.length);
    assert.equal(python.pack.referenceTopics.length, require('../packs/python-reference.json').length + 1);
    assert.ok(python.pack.cards.some(card => card.id === 'python-sqlite3-client-find'));
    const javascript = entries.find(entry => entry.adapter.languageId === 'javascript');
    assert.deepEqual(javascript.adapter.aliases, ['javascriptreact']);
    assert.equal(javascript.pack.cards.length, require('../packs/javascript.json').cards.length);
    assert.equal(javascript.pack.referenceTopics.length, require('../packs/javascript-reference.json').length);
    for (const id of ['html', 'css', 'sql', 'yaml']) {
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
