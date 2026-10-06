const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const pack = require('../packs/rust.json');
const { rustAdapter } = require('../out/languages/rust');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function harness(saved = {}) {
  const handlers = {};
  const preferences = { debounceMs: { globalValue: 100 } };
  const updates = [];
  const scopes = [];
  const storage = { get: key => saved[key], update: async (key, value) => { saved[key] = value; } };
  const event = key => listener => { handlers[key] = listener; return { dispose() { delete handlers[key]; } }; };
  const uri = value => ({ toString: () => value });
  const vscode = {
    ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
    Uri: { joinPath: (root, ...parts) => uri([root.toString(), ...parts].join('/')) },
    Range: class { constructor(start, end) { this.start = start; this.end = end; } },
    window: { activeTextEditor: undefined, onDidChangeActiveTextEditor: event('active'), onDidChangeTextEditorSelection: event('cursor') },
    workspace: {
      onDidChangeTextDocument: event('edit'), onDidCloseTextDocument: event('close'), onDidChangeConfiguration: event('config'),
      getConfiguration: (section, scope) => {
        scopes.push(scope);
        return {
          inspect: key => ({ defaultValue: key === 'maxCards' ? 5 : 350, ...preferences[key] }),
          get: (key, fallback) => {
            const values = preferences[key] ?? {};
            return values.workspaceFolderLanguageValue ?? values.workspaceLanguageValue ?? values.globalLanguageValue
              ?? values.workspaceFolderValue ?? values.workspaceValue ?? values.globalValue ?? (key === 'maxCards' ? 5 : fallback);
          },
          update: async (key, value, target, language) => {
            updates.push({ key, value, target, language });
            const field = ({ 1: 'global', 2: 'workspace', 3: 'workspaceFolder' })[target] + (language ? 'LanguageValue' : 'Value');
            preferences[key] = { ...preferences[key], [field]: value };
          },
        };
      },
    },
    commands: { executeCommand: async () => [] },
  };
  function editor(text, file = 'file:///demo.rs', languageId = 'rust') {
    const document = {
      text: text.replace('CURSOR', ''), version: 1, uri: uri(file), languageId,
      get lineCount() { return this.text.split('\n').length; },
      getText(range) { return range ? this.text.slice(this.offsetAt(range.start), this.offsetAt(range.end)) : this.text; },
      getWordRangeAtPosition() { return undefined; },
      lineAt(line) { return { text: this.text.split('\n')[line] }; },
      offsetAt(pos) { return this.text.split('\n').slice(0, pos.line).reduce((n, s) => n + s.length + 1, 0) + pos.character; },
      positionAt(offset) {
        const lines = this.text.slice(0, Math.max(0, Math.min(offset, this.text.length))).split('\n');
        return { line: lines.length - 1, character: lines.at(-1).length };
      },
    };
    return { document, selection: { active: document.positionAt(text.indexOf('CURSOR') < 0 ? 0 : text.indexOf('CURSOR')) } };
  }
  const original = Module._load;
  Module._load = function (name, ...args) { return name === 'vscode' ? vscode : original.call(this, name, ...args); };
  delete require.cache[require.resolve('../out/controller')];
  delete require.cache[require.resolve('../out/sidebar')];
  let controller;
  try {
    const { ReferenceController } = require('../out/controller');
    controller = new ReferenceController(uri('file:///extension'), [{ pack, adapter: rustAdapter }], storage);
  } finally { Module._load = original; }
  const states = [];
  const messages = {};
  const view = {
    visible: true,
    webview: { cspSource: 'https://webview.test', asWebviewUri: x => x.toString(), postMessage: state => { states.push(state); return Promise.resolve(true); },
      onDidReceiveMessage: callback => { messages.receive = callback; return { dispose() {} }; } },
    onDidChangeVisibility: callback => { messages.visibility = callback; return { dispose() {} }; },
    onDidDispose: callback => { messages.dispose = callback; return { dispose() {} }; },
  };
  controller.sidebar.resolveWebviewView(view);
  return { vscode, handlers, controller, view, states, messages, editor, preferences, updates, scopes, saved };
}

test('pins persist by language and card ID across context changes and reloads, with collapse and unpin', async () => {
  const saved = { pins: [{ languageId: 'rust', cardId: 'retired-card' }, null, { languageId: 'unknown', cardId: 'use' }] };
  const h = harness(saved);
  try {
    h.vscode.window.activeTextEditor = h.editor('CURSOR\nfn main() {}');
    h.handlers.active();
    await delay(130);
    assert.deepEqual(h.states.at(-1).pins, []);
    const cardId = h.states.at(-1).relevant[0].id;
    const pin = { type: 'pin', action: 'pin', languageId: 'rust', cardId };
    h.messages.receive(pin);
    h.messages.receive(pin);
    h.messages.receive({ ...pin, cardId: 'not-a-card' });
    h.messages.receive({ ...pin, languageId: 'unknown' });
    assert.equal(h.states.at(-1).pins.length, 1);
    h.messages.receive({ ...pin, action: 'collapse', collapsed: true });
    h.messages.receive({ type: 'pin', action: 'collapseAll', collapsed: true });
    h.vscode.window.activeTextEditor = h.editor('CURSORlet x = 1;', 'file:///other.ts', 'typescript');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).pins[0].card.id, cardId);
    assert.equal(h.states.at(-1).pins[0].collapsed, true);
    assert.equal(h.states.at(-1).pinsCollapsed, true);
    assert.deepEqual(saved.pins, [{ languageId: 'rust', cardId, collapsed: true }]);
    const restored = harness(saved);
    try {
      restored.messages.receive({ type: 'ready' });
      assert.equal(restored.states.at(-1).pins[0].card.code, pack.cards.find(card => card.id === cardId).code);
      assert.equal(restored.states.at(-1).pinsCollapsed, true);
      restored.messages.receive({ ...pin, action: 'unpin' });
      await delay(10);
      assert.deepEqual(restored.states.at(-1).pins, []);
      assert.deepEqual(saved.pins, []);
    } finally { restored.controller.dispose(); }
  } finally { h.controller.dispose(); }
});

test('card count ignores stale manifest defaults, honors preferences and saves sidebar choices', async () => {
  const h = harness();
  try {
    const editor = h.editor('CURSOR\nfn main() {}');
    h.vscode.window.activeTextEditor = editor;
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).pageSize, 12, 'old manifest default of five must not cap the new build');
    assert.equal(h.scopes.at(-1), editor.document);
    h.preferences.maxCards = { workspaceFolderLanguageValue: 5 };
    h.handlers.config({ affectsConfiguration: () => true });
    await delay(30);
    assert.equal(h.states.at(-1).pageSize, 5, 'explicit preference remains respected');
    h.messages.receive({ type: 'cardCount', count: 20 });
    await delay(30);
    assert.deepEqual(h.updates.at(-1), { key: 'maxCards', value: 20, target: 3, language: true });
    assert.equal(h.states.at(-1).pageSize, 20);
    for (const count of [2, 31, 12.5, '20', null]) h.messages.receive({ type: 'cardCount', count });
    assert.equal(h.updates.length, 1);
    delete h.preferences.maxCards;
    h.messages.receive({ type: 'cardCount', count: 12 });
    await delay(30);
    assert.deepEqual(h.updates.at(-1), { key: 'maxCards', value: 12, target: 1, language: false });
  } finally { h.controller.dispose(); }
});

test('controller end to end: Rust context, search, edits, debounce and unsupported files', async () => {
  const h = harness();
  try {
    h.vscode.window.activeTextEditor = h.editor('use std::io;\nCURSOR\nfn main() {}');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).scope, 'module');
    assert.equal(h.states.at(-1).relevant.length, 60);
    assert.equal(h.states.at(-1).pageSize, 12);
    assert.ok(h.states.at(-1).relevant.some(c => c.id === 'use'));
    h.messages.receive({ type: 'search', query: 'handle a missing value' });
    assert.ok(h.states.at(-1).search[0].topics.includes('option'));
    assert.equal(h.states.at(-1).query, 'handle a missing value');
    h.messages.receive({ type: 'search', query: null });
    assert.equal(h.states.at(-1).query, 'handle a missing value');

    const active = h.editor('fn main() {\n let value: Option<i32> = CURSORSome(1);\n}');
    h.vscode.window.activeTextEditor = active;
    const base = active.document.offsetAt(active.selection.active);
    for (let n = 0; n < 10; n++) {
      active.selection.active = active.document.positionAt(base + n % 4);
      h.handlers.cursor({ textEditor: active });
    }
    const before = h.states.length;
    await delay(130);
    assert.equal(h.states.length, before + 1, 'cursor burst should cause one scan');
    assert.equal(h.states.at(-1).scope, 'function');
    assert.ok(h.states.at(-1).relevant[0].topics.includes('option'));

    active.document.version++;
    h.handlers.edit({ document: active.document, contentChanges: [{ text: 'Option<i32>', range: { start: { line: 1 } } }] });
    await delay(130);
    assert.ok(h.states.at(-1).relevant[0].topics.includes('option'));
    assert.equal(h.states.at(-1).query, 'handle a missing value');

    h.vscode.window.activeTextEditor = h.editor('CURSORconst x = 1;', 'file:///demo.ts', 'typescript');
    h.handlers.active();
    await delay(130);
    assert.deepEqual(h.states.at(-1).relevant, []);
    assert.match(h.states.at(-1).message, /No reference pack/);
    assert.ok(h.states.at(-1).search.length > 0);
  } finally { h.controller.dispose(); }
});

test('late symbol response cannot replace newer editor context', async () => {
  const h = harness();
  try {
    let resolveSymbols;
    h.vscode.commands.executeCommand = () => new Promise(resolve => { resolveSymbols = resolve; });
    const first = h.editor('fn main() {\n CURSOR\n}', 'file:///first.rs');
    h.vscode.window.activeTextEditor = first;
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).scope, 'function');
    h.vscode.window.activeTextEditor = h.editor('CURSOR\nfn next() {}', 'file:///second.rs');
    h.handlers.active();
    const before = h.states.length;
    resolveSymbols([{ name: 'wrong', kind: 12, range: { start: { line: 0, character: 0 }, end: { line: 2, character: 1 } }, children: [] }]);
    await delay(10);
    assert.equal(h.states.length, before);
    h.vscode.commands.executeCommand = async () => [];
    await delay(130);
    assert.equal(h.states.at(-1).scope, 'module');
  } finally { h.controller.dispose(); }
});

test('hidden sidebar skips retrieval and refreshes when reopened', async () => {
  const h = harness();
  try {
    h.view.visible = false;
    h.vscode.window.activeTextEditor = h.editor('fn main() {\n let data: Option<i32> = CURSORNone;\n}');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.length, 0);
    h.view.visible = true;
    h.messages.visibility();
    await delay(30);
    assert.equal(h.states.at(-1).scope, 'function');
    assert.ok(h.states.at(-1).relevant[0].topics.includes('option'));
  } finally { h.controller.dispose(); }
});

test('symbols refine signatures and a missing language server preserves fallback cards', async () => {
  const h = harness();
  try {
    const editor = h.editor('CURSORfn example(value: i32) {\n}');
    h.vscode.window.activeTextEditor = editor;
    h.vscode.commands.executeCommand = async () => [{ name: 'example', kind: 12,
      range: { start: { line: 0, character: 0 }, end: { line: 1, character: 1 } }, children: [] }];
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).scope, 'function');
    h.vscode.commands.executeCommand = async () => { throw new Error('Provider unavailable'); };
    editor.document.version++;
    editor.selection.active = { line: 1, character: 0 };
    h.handlers.cursor({ textEditor: editor });
    await delay(130);
    assert.equal(h.states.at(-1).relevant.length, 60);
    assert.equal(h.states.at(-1).scope, 'function');
  } finally { h.controller.dispose(); }
});

module.exports = { harness };
