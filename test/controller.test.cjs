const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const pack = { ...require('../packs/rust.json'), referenceTopics: require('../packs/rust-reference.json') };
const { rustAdapter } = require('../out/languages/rust');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function harness(saved = {}, entries = [{ pack, adapter: rustAdapter }]) {
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
    window: { activeTextEditor: undefined, onDidChangeActiveTerminal: event('terminal'), onDidCloseTerminal: event('terminalClose'), onDidChangeTerminalShellIntegration: event('integration'), onDidStartTerminalShellExecution: event('terminalStart'), onDidEndTerminalShellExecution: event('terminalEnd'), onDidChangeActiveTextEditor: event('active'), onDidChangeTextEditorSelection: event('cursor') },
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
    controller = new ReferenceController(uri('file:///extension'), entries, storage);
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
    assert.deepEqual(h.states.at(-1).searchTopics, ['option']);
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

test('lesson actions persist across reload and editor changes; reset and delete require confirmation', async () => {
  const h = harness();
  let choice;
  h.vscode.window.showWarningMessage = async () => choice;
  const send = action => h.messages.receive({ type: 'lesson', languageId: 'rust', ...action });
  try {
    send({ action: 'status', id: 'hello', status: 'todo' });
    send({ action: 'status', id: 'hello', status: 'in-progress' });
    send({ action: 'status', id: 'hello', status: 'done' });
    send({ action: 'save', lesson: { title: 'Personal task', difficulty: 2, instructions: 'Try this.', starter: '', check: 'Verify it.' } });
    await delay(10);
    const id = h.states.at(-1).lessonLibraries[0].lessons.find(lesson => lesson.custom).id;
    assert.equal(h.saved.lessons.languages.rust.statuses[id], 'todo');
    assert.equal(h.saved.lessons.languages.rust.statuses.hello, 'done');
    const before = h.states.length;
    for (const action of [{ action: 'save', id: 'hello', lesson: { title: 'No', difficulty: 1, instructions: 'No', starter: '', check: 'No' } },
      { action: 'status', id: 'hello', status: 'invalid' }, { action: 'status', id: 'absent', status: 'done' }]) send(action);
    assert.equal(h.states.length, before);
    send({ action: 'reset', all: false });
    send({ action: 'delete', id });
    await delay(10);
    assert.equal(h.states.length, before, 'cancelled destructive actions do nothing');
    h.vscode.window.activeTextEditor = h.editor('CURSORpackage main', 'file:///main.go', 'go');
    h.handlers.active(); await delay(130);
    assert.equal(h.states.at(-1).lessonLibraries[0].lessons[0].status, 'done');
    const restored = harness(h.saved);
    try {
      restored.messages.receive({ type: 'ready' });
      assert.equal(restored.states.at(-1).lessonLibraries[0].lessons[0].status, 'done');
    } finally { restored.controller.dispose(); }
    choice = 'Reset progress'; send({ action: 'reset', all: false }); await delay(10);
    assert.equal(h.saved.lessons.languages.rust.statuses.hello, undefined);
    assert.equal(h.saved.lessons.languages.rust.custom.length, 1);
    choice = 'Delete lesson'; send({ action: 'delete', id }); await delay(10);
    assert.equal(h.saved.lessons.languages.rust.custom.length, 0);
  } finally { h.controller.dispose(); }
});

test('cursor context publishes direct topic suggestions and clears them outside supported editors', async () => {
  const h = harness();
  try {
    h.vscode.window.activeTextEditor = h.editor('fn main() { foCURSORr item in items {} }');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).suggestedTopics[0], 'loops');
    assert.ok(h.states.at(-1).suggestedTopics.length <= 2);
    h.vscode.window.activeTextEditor = h.editor('fn main() { let value = SoCURSORme(1); }', 'file:///option.rs');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).suggestedTopics[0], 'option');
    h.vscode.window.activeTextEditor = h.editor('forCURSOR', 'file:///other.ts', 'typescript');
    h.handlers.active();
    await delay(130);
    assert.deepEqual(h.states.at(-1).suggestedTopics, []);
    h.vscode.window.activeTextEditor = undefined;
    h.handlers.active();
    await delay(130);
    assert.deepEqual(h.states.at(-1).suggestedTopics, []);
  } finally { h.controller.dispose(); }
});

test('switching TypeScript, TSX, Go and Rust retains search and language-qualified pins', async () => {
  const goPack = { ...require('../packs/go.json'), referenceTopics: require('../packs/go-reference.json') };
  const { goAdapter } = require('../out/languages/go');
  const tsPack = { ...require('../packs/typescript.json'), referenceTopics: require('../packs/typescript-reference.json') };
  const { typescriptAdapter } = require('../out/languages/typescript');
  const entries = [{ pack, adapter: rustAdapter }, { pack: goPack, adapter: goAdapter }, { pack: tsPack, adapter: typescriptAdapter }];
  const h = harness({}, entries);
  try {
    h.vscode.window.activeTextEditor = h.editor('func main() {\n CURSORcounts := map[string]int{}\n}', 'file:///demo.go', 'go');
    h.handlers.active();
    await delay(130);
    let state = h.states.at(-1);
    assert.equal(state.languageId, 'go');
    assert.equal(state.language, 'Go');
    assert.equal(state.scope, 'function');
    assert.equal(state.reference.referenceTopics.length, 26);
    assert.ok(state.relevant.some(card => card.id === 'maps'));
    h.messages.receive({ type: 'search', query: 'propagate error' });
    assert.equal(h.states.at(-1).search[0].id, 'errors');
    assert.deepEqual(h.states.at(-1).searchTopics, ['errors']);
    h.messages.receive({ type: 'pin', action: 'pin', languageId: 'go', cardId: 'maps' });
    h.vscode.window.activeTextEditor = h.editor('fn main() { CURSOR }');
    h.handlers.active();
    await delay(130);
    state = h.states.at(-1);
    assert.equal(state.languageId, 'rust');
    assert.equal(state.query, 'propagate error');
    assert.ok(state.search[0].topics.includes('result'));
    assert.deepEqual(state.searchTopics, ['result']);
    assert.equal(state.pins[0].languageId, 'go');
    h.messages.receive({ type: 'pin', action: 'pin', languageId: 'rust', cardId: 'use' });
    h.vscode.window.activeTextEditor = h.editor('package main\nCURSOR', 'file:///second.go', 'go');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).languageId, 'go');
    assert.equal(h.states.at(-1).pins.length, 2);
    h.vscode.window.activeTextEditor = h.editor('function count() {\n CURSORconst counts = new Map<string, number>();\n}', 'file:///demo.ts', 'typescript');
    h.handlers.active();
    await delay(130);
    state = h.states.at(-1);
    assert.equal(state.languageId, 'typescript');
    assert.equal(state.language, 'TypeScript');
    assert.equal(state.scope, 'function');
    assert.equal(state.reference.referenceTopics.length, tsPack.referenceTopics.length);
    assert.ok(state.relevant.some(card => card.id === 'maps'));
    assert.equal(state.query, 'propagate error');
    h.messages.receive({ type: 'search', query: 'key value lookup' });
    assert.equal(h.states.at(-1).search[0].id, 'maps');
    assert.deepEqual(h.states.at(-1).searchTopics, ['maps']);
    h.messages.receive({ type: 'pin', action: 'pin', languageId: 'typescript', cardId: 'maps' });
    h.vscode.window.activeTextEditor = h.editor('const View = () => { CURSORreturn <div />; };', 'file:///demo.tsx', 'typescriptreact');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).languageId, 'typescript');
    assert.equal(h.states.at(-1).pins.length, 3);
    assert.equal(h.states.at(-1).search[0].id, 'maps');
    h.vscode.window.activeTextEditor = h.editor('fn main() { CURSOR }');
    h.handlers.active();
    await delay(130);
    assert.equal(h.states.at(-1).languageId, 'rust');
    assert.equal(h.states.at(-1).pins.at(-1).languageId, 'typescript');
    const restored = harness(h.saved, entries);
    try { restored.messages.receive({ type: 'ready' }); assert.equal(restored.states.at(-1).pins.length, 3); }
    finally { restored.controller.dispose(); }
  } finally { h.controller.dispose(); }
});

test('terminal commands update context, isolate background terminals, and return to editors', async () => {
  const shellPack = { ...require('../packs/shellscript.json'), referenceTopics: require('../packs/shellscript-reference.json') };
  const { shellAdapter } = require('../out/languages/shell');
  const h = harness({}, [{ pack, adapter: rustAdapter }, { pack: shellPack, adapter: shellAdapter }]);
  try {
    const terminal = { shellIntegration: {} };
    h.vscode.window.activeTerminal = terminal;
    h.vscode.window.activeTextEditor = h.editor('fn main() { CURSOR }');
    h.controller.useTerminal(terminal);
    await delay(30);
    assert.equal(h.states.at(-1).languageId, 'shellscript');
    assert.match(h.states.at(-1).message, /Type in a new Zsh/);
    h.messages.receive({ type: 'search', query: 'TypeScript' });
    assert.equal(h.states.at(-1).search[0].id, 'typescript');
    h.messages.receive({ type: 'pin', action: 'pin', languageId: 'shellscript', cardId: 'cargo-test' });
    h.handlers.active(h.vscode.window.activeTextEditor);
    await delay(130);
    assert.equal(h.states.at(-1).languageId, 'rust');
    assert.equal(h.states.at(-1).pins[0].languageId, 'shellscript');
    h.controller.useTerminal({});
    await delay(30);
    assert.match(h.states.at(-1).message, /Shell integration unavailable/);
  } finally { h.controller.dispose(); }
});

test('terminal execution events sanitize cues and ignore background command completions', async () => {
  const shellPack = { ...require('../packs/shellscript.json'), referenceTopics: require('../packs/shellscript-reference.json') };
  const { shellAdapter } = require('../out/languages/shell');
  const h = harness({}, [{ pack, adapter: rustAdapter }, { pack: shellPack, adapter: shellAdapter }]);
  try {
    const first = { shellIntegration: {} }, second = { shellIntegration: {} };
    h.vscode.window.activeTerminal = first;
    h.handlers.terminal(first);
    h.handlers.terminalStart({ terminal: first, execution: { commandLine: { value: 'TOKEN=secret cargo test private_test -- --nocapture' } } });
    await delay(30);
    assert.equal(h.states.at(-1).relevant[0].id, 'cargo-test');
    assert.equal(h.states.at(-1).suggestedTopics[0], 'cargo-test');
    assert.equal(h.controller.terminalCommands.get(first), 'cargo test');
    h.handlers.terminalEnd({ terminal: second, execution: { commandLine: { value: 'go test ./...' } } });
    await delay(30);
    assert.equal(h.states.at(-1).relevant[0].id, 'cargo-test');
    h.vscode.window.activeTerminal = second;
    h.handlers.terminal(second);
    await delay(30);
    assert.equal(h.states.at(-1).relevant[0].id, 'go-test');
    h.vscode.window.activeTextEditor = h.editor('fn main() { CURSOR }');
    h.handlers.cursor({ textEditor: h.vscode.window.activeTextEditor });
    await delay(130);
    assert.equal(h.states.at(-1).languageId, 'rust');
    h.handlers.terminalEnd({ terminal: second, execution: { commandLine: { value: 'go test ./...' } } });
    await delay(30);
    assert.equal(h.states.at(-1).languageId, 'rust', 'late completion must not steal editor context');
    h.handlers.terminalClose(second);
    assert.equal(h.controller.terminalCommands.has(second), false);
    h.view.visible = false;
    h.handlers.terminal(first);
    h.view.visible = true;
    h.messages.visibility();
    await delay(30);
    assert.equal(h.states.at(-1).languageId, 'shellscript');
  } finally { h.controller.dispose(); }
});


test('pausing on live terminal input narrows git examples before execution and clearing restores defaults', async () => {
  const shellPack = { ...require('../packs/shellscript.json'), referenceTopics: require('../packs/shellscript-reference.json') };
  const { shellAdapter } = require('../out/languages/shell');
  const h = harness({}, [{ pack, adapter: rustAdapter }, { pack: shellPack, adapter: shellAdapter }]);
  try {
    const terminal = { shellIntegration: {} };
    h.vscode.window.activeTerminal = terminal;
    for (const cues of ['g', 'gi', 'git']) h.controller.updateTerminalInput(terminal, cues);
    await delay(130);
    assert.deepEqual(new Set(h.states.at(-1).relevant.map(card => card.id)), new Set(['git-status','git-branch','git-log']));
    assert.equal(h.states.at(-1).suggestedTopics.length, 2);
    h.controller.updateTerminalInput(terminal, 'git diff');
    await delay(130);
    assert.equal(h.states.at(-1).relevant[0].id, 'git-status');
    h.controller.updateTerminalInput({}, 'cargo test');
    await delay(130);
    assert.equal(h.states.at(-1).relevant[0].id, 'git-status');
    h.controller.updateTerminalInput(terminal, '');
    await delay(130);
    assert.equal(h.states.at(-1).relevant.length, Math.min(60, shellPack.cards.length));
  } finally { h.controller.dispose(); }
});

test('HTML and CSS editors switch catalogs and retain cross-language pins and lesson progress', async () => {
  const { htmlAdapter, cssAdapter } = require('../out/languages/web');
  const web = [htmlAdapter, cssAdapter].map(adapter => ({ adapter, pack: {
    ...require(`../packs/${adapter.languageId}.json`), referenceTopics: require(`../packs/${adapter.languageId}-reference.json`) } }));
  const h = harness({}, [{ pack, adapter: rustAdapter }, ...web]);
  try {
    for (const [language, source, query, id] of [
      ['html', '<input type="email" CURSORrequired>', 'email validation', 'inputs'],
      ['css', '.beds { display: grid; CURSOR }', 'responsive grid', 'grid'],
    ]) {
      h.vscode.window.activeTextEditor = h.editor(source, `file:///demo.${language}`, language);
      h.handlers.active();
      await delay(130);
      assert.equal(h.states.at(-1).languageId, language);
      assert.equal(h.states.at(-1).reference.languageId, language);
      h.messages.receive({ type: 'search', query });
      assert.equal(h.states.at(-1).search[0].id, id);
      h.messages.receive({ type: 'pin', action: 'pin', languageId: language, cardId: id });
      h.messages.receive({ type: 'search', query: '' });
      h.messages.receive({ type: 'lesson', action: 'save', languageId: language, lesson: { title: `Practice ${language}`, instructions: 'Create an accessible garden card.', difficulty: 1, starter: '', check: '' } });
    }
    await delay(0);
    assert.deepEqual(h.states.at(-1).pins.map(pin => pin.languageId), ['html','css']);
    assert.equal(h.saved.lessons.languages.html.custom.length, 1);
    assert.equal(h.saved.lessons.languages.css.custom.length, 1);
  } finally { h.controller.dispose(); }
});

test('JS/JSX share pins and personal progress; TS/TSX retain existing identity separately', async () => {
  const { javascriptAdapter } = require('../out/languages/javascript');
  const { typescriptAdapter } = require('../out/languages/typescript');
  const entries = [javascriptAdapter, typescriptAdapter].map(adapter => ({ adapter, pack: {
    ...require(`../packs/${adapter.languageId}.json`), referenceTopics: require(`../packs/${adapter.languageId}-reference.json`),
  } }));
  const h = harness({ pins: [{languageId:'typescript',cardId:'maps'}] }, entries);
  try {
    for (const [editorId, language, cardId] of [['javascript','javascript','js-react-state'],['javascriptreact','javascript','js-react-state'],['typescript','typescript','tsx-react-state'],['typescriptreact','typescript','tsx-react-state']]) {
      h.vscode.window.activeTextEditor=h.editor('const View = () => <button CURSORonClick={() => save()}>Save</button>;', `file:///demo.${editorId}`, editorId);
      h.handlers.active();await delay(130);
      assert.equal(h.states.at(-1).languageId,language);
      h.messages.receive({type:'search',query:'react state'});
      assert.ok(h.states.at(-1).search.some(card=>card.id===cardId));
      h.messages.receive({type:'pin',action:'pin',languageId:language,cardId});
    }
    assert.equal(h.states.at(-1).pins.length,3);
    assert.ok(h.states.at(-1).pins.some(pin=>pin.languageId==='typescript'&&pin.card.id==='maps'));
    for (const languageId of ['javascript','typescript']) {
      h.messages.receive({type:'lesson',action:'save',languageId,lesson:{title:`Practice ${languageId}`,difficulty:1,instructions:'Create and test a counter.',starter:'// Create a counter and verify two increments.',check:'Two increments return 2.'}});
      await delay(10);
      const lesson=h.states.at(-1).lessonLibraries.find(library=>library.languageId===languageId).lessons[0];
      h.messages.receive({type:'lesson',action:'status',languageId,id:lesson.id,status:'done'});
    }
    await delay(10);
    const restored=harness(h.saved,entries);
    try {
      restored.messages.receive({type:'ready'});
      assert.equal(restored.states.at(-1).pins.length,3);
      for(const library of restored.states.at(-1).lessonLibraries) assert.equal(library.lessons[0].status,'done');
    } finally {restored.controller.dispose();}
  } finally {h.controller.dispose();}
});

test('SQL dialect setting refreshes search and reference while pins and progress keep stable language identity', async () => {
  const { sqlAdapter } = require('../out/languages/sql');
  const sql = { ...require('../packs/sql.json'), referenceTopics:require('../packs/sql-reference.json') };
  const saved = {};
  const h = harness(saved, [{pack,adapter:rustAdapter},{pack:sql,adapter:sqlAdapter}]);
  try {
    h.vscode.window.activeTextEditor=h.editor('SELECT name FROM customers WHERE id = ? CURSOR','file:///tour.sql','sql');
    h.handlers.active(); await delay(130);
    assert.equal(h.states.at(-1).language,'SQL (SQLite)');
    assert.ok(!h.states.at(-1).reference.concepts.some(c=>c.id==='pg-json'));
    h.messages.receive({type:'search',query:'parameterized query'});
    assert.equal(h.states.at(-1).search[0].id,'sql-parameters');
    h.messages.receive({type:'pin',action:'pin',languageId:'sql',cardId:'sql-parameters'});
    h.messages.receive({type:'lesson',action:'status',languageId:'sql',id:'sql-first-report',status:'todo'});
    h.preferences.sqlDialect={workspaceFolderValue:'postgresql'};
    h.handlers.config({affectsConfiguration:()=>true}); await delay(30);
    assert.equal(h.states.at(-1).language,'SQL (PostgreSQL)');
    assert.ok(!h.states.at(-1).reference.concepts.some(c=>c.id==='sqlite-setup'));
    assert.equal(h.states.at(-1).search[0].id,'sql-parameters-postgresql');
    assert.equal(h.states.at(-1).pins[0].card.id,'sql-parameters');
    assert.match(h.states.at(-1).pins[0].card.code,/SQLite only/);
    h.messages.receive({type:'pin',action:'pin',languageId:'sql',cardId:'sql-pg-json'});
    h.vscode.window.activeTextEditor=h.editor('let x = 1; CURSOR','file:///other.rs','rust');
    h.handlers.active(); await delay(130);
    assert.equal(h.states.at(-1).languageId,'rust');
    assert.ok(h.states.at(-1).relevant.every(c=>!c.id.startsWith('sql-')));
    assert.equal(saved.lessons.languages.sql.statuses['sql-first-report'],'todo');
    const restored=harness(saved,[{pack,adapter:rustAdapter},{pack:sql,adapter:sqlAdapter}]);
    try {
      restored.messages.receive({type:'ready'});
      assert.deepEqual(restored.states.at(-1).pins.map(p=>p.card.id),['sql-parameters','sql-pg-json']);
      restored.messages.receive({type:'pin',action:'unpin',languageId:'sql',cardId:'sql-pg-json'});
      assert.equal(restored.states.at(-1).pins.length,1);
    } finally { restored.controller.dispose(); }
  } finally { h.controller.dispose(); }
});
