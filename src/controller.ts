import * as vscode from 'vscode';
import { LanguageAdapter, ReferencePack, SymbolContext } from './core/types';
import { Retriever } from './core/retrieval';
import { ReferenceSidebar, SidebarState, PinnedCard, PinAction } from './sidebar';

interface Language { pack: ReferencePack; adapter: LanguageAdapter; retriever: Retriever }
interface Edit { text: string; time: number }

export class ReferenceController implements vscode.Disposable {
  readonly sidebar: ReferenceSidebar;
  private readonly languages = new Map<string, Language>();
  private readonly subscriptions: vscode.Disposable[] = [];
  private readonly edits = new Map<string, Edit[]>();
  private readonly symbols = new Map<string, { version: number; time: number; value: SymbolContext[] }>();
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private fingerprint = '';
  private query = '';
  private disposed = false;
  private currentLanguage: Language;
  private state: SidebarState;
  private readonly pins = new Map<string, PinnedCard>();
  private pinSave: Promise<void> = Promise.resolve();

  constructor(root: vscode.Uri, entries: { pack: ReferencePack; adapter: LanguageAdapter }[], private readonly storage?: vscode.Memento) {
    if (!entries.length) throw new Error('At least one language pack is required');
    for (const entry of entries) this.languages.set(entry.pack.languageId, { ...entry, retriever: new Retriever(entry.pack) });
    this.currentLanguage = this.languages.values().next().value!;
    const saved = storage?.get<unknown>('pins');
    if (Array.isArray(saved)) for (const item of saved) {
      if (!item || typeof item !== 'object' || typeof item.languageId !== 'string' || typeof item.cardId !== 'string') continue;
      const card = this.languages.get(item.languageId)?.pack.cards.find(card => card.id === item.cardId);
      if (card) this.pins.set(this.pinKey(item.languageId, item.cardId), { languageId: item.languageId, card, collapsed: item.collapsed === true });
    }
    this.state = { languageId: this.currentLanguage.pack.languageId, language: this.currentLanguage.pack.displayName, scope: '', relevant: [], search: [], query: '', message: 'Open a Rust file to see relevant syntax.', pageSize: this.settings().maxCards,
      pins: [...this.pins.values()], pinsCollapsed: storage?.get<unknown>('pinsCollapsed') === true };
    this.sidebar = new ReferenceSidebar(root, query => this.search(query), () => this.schedule(true),
      count => { void this.setCardCount(count); }, action => this.changePin(action));
    this.sidebar.update(this.state);
    this.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => this.schedule()),
      vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor === vscode.window.activeTextEditor) this.schedule();
      }),
      vscode.workspace.onDidChangeTextDocument(event => {
        if (!event.contentChanges.length) return;
        const key = event.document.uri.toString();
        if (this.languages.has(event.document.languageId)) {
          const now = Date.now();
          const history = (this.edits.get(key) ?? []).filter(e => now - e.time < 45_000);
          for (const change of event.contentChanges) {
            const text = change.text || event.document.lineAt(Math.min(change.range.start.line, event.document.lineCount - 1)).text;
            history.push({ text: text.slice(0, 500), time: now });
          }
          this.edits.set(key, history.slice(-8));
          this.trimCache(this.edits);
        }
        this.symbols.delete(key);
        if (event.document === vscode.window.activeTextEditor?.document) this.schedule();
      }),
      vscode.workspace.onDidCloseTextDocument(document => {
        const key = document.uri.toString();
        this.edits.delete(key); this.symbols.delete(key);
      }),
      vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('syntaxiser')) this.schedule(true);
      }),
    );
  }

  schedule(force = false): void {
    if (this.disposed) return;
    const editor = vscode.window.activeTextEditor;
    const position = editor?.selection.active;
    const word = editor && position ? editor.document.getWordRangeAtPosition(position) : undefined;
    const fingerprint = editor && position
      ? `${editor.document.uri}|${editor.document.version}|${position.line}|${word ? editor.document.getText(word) : position.character}` : 'none';
    if (!force && fingerprint === this.fingerprint) return;
    this.fingerprint = fingerprint;
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    if (!this.sidebar.visible) return;
    const delay = force ? 0 : this.settings().debounceMs;
    this.timer = setTimeout(() => { this.timer = undefined; void this.refresh(); }, delay);
  }

  private search(query: string): void {
    this.query = query;
    this.publish({ query, pageSize: this.settings().maxCards, search: this.currentLanguage.retriever.search(query, 60).map(r => r.card) });
  }

  private pinKey(languageId: string, cardId: string): string { return JSON.stringify([languageId, cardId]); }

  private changePin(action: PinAction): void {
    if (this.disposed) return;
    if (action.action === 'collapseAll') {
      this.publish({ pinsCollapsed: action.collapsed });
    } else {
      const card = this.languages.get(action.languageId)?.pack.cards.find(card => card.id === action.cardId);
      if (!card) return;
      const key = this.pinKey(action.languageId, action.cardId);
      const existing = this.pins.get(key);
      if (action.action === 'pin') {
        if (existing) return;
        this.pins.set(key, { languageId: action.languageId, card, collapsed: false });
      } else if (action.action === 'unpin') {
        if (!this.pins.delete(key)) return;
      } else {
        if (!existing) return;
        this.pins.set(key, { ...existing, collapsed: action.collapsed });
      }
      this.publish({ pins: [...this.pins.values()] });
    }
    // Persist identifiers, not snapshots, so pins use updated curated content after upgrades.
    const pins = this.state.pins.map(pin => ({ languageId: pin.languageId, cardId: pin.card.id, collapsed: pin.collapsed }));
    const collapsed = this.state.pinsCollapsed;
    this.pinSave = this.pinSave.then(async () => {
      await this.storage?.update('pins', pins);
      await this.storage?.update('pinsCollapsed', collapsed);
    }).catch(error => {
      void vscode.window.showErrorMessage(`Syntaxiser could not save pins: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  private async refresh(): Promise<void> {
    const generation = this.generation;
    const editor = vscode.window.activeTextEditor;
    const language = editor ? this.languages.get(editor.document.languageId) : undefined;
    if (!editor || !language) {
      this.publish({ scope: '', relevant: [], pageSize: this.settings().maxCards, message: editor
        ? `No reference pack for ${editor.document.languageId} yet. Search ${this.currentLanguage.pack.displayName} above.`
        : 'Open a Rust file to see relevant syntax.' });
      return;
    }
    this.currentLanguage = language;
    const document = editor.document;
    const version = document.version;
    const key = document.uri.toString();
    const offset = document.offsetAt(editor.selection.active);
    // Bound scanner work on generated/large files. Symbols remain absolute until rebased.
    const startOffset = Math.max(0, offset - 180_000);
    const text = document.getText(new vscode.Range(document.positionAt(startOffset), document.positionAt(offset + 16_000)));
    const recentEdits = (this.edits.get(key) ?? []).filter(e => Date.now() - e.time < 45_000).map(e => e.text);
    const render = (symbols: SymbolContext[]) => {
      if (this.disposed || generation !== this.generation || vscode.window.activeTextEditor !== editor || document.version !== version) return;
      const context = language.adapter.extract({ text, offset: offset - startOffset,
        symbols: symbols.map(s => ({ ...s, start: s.start - startOffset, end: s.end - startOffset })), recentEdits });
      this.publish({ languageId: language.pack.languageId, language: language.pack.displayName, scope: context.scope,
        relevant: language.retriever.relevant(context, 60).map(r => r.card), message: '', pageSize: this.settings().maxCards,
        search: language.retriever.search(this.query, 60).map(r => r.card) });
    };
    const cached = this.symbols.get(key);
    if (cached && cached.version === version && Date.now() - cached.time < 15_000) { render(cached.value); return; }
    render([]);
    // Never hold up reference cards waiting for a language server. Late answers are ignored.
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        vscode.commands.executeCommand<(vscode.DocumentSymbol | vscode.SymbolInformation)[]>('vscode.executeDocumentSymbolProvider', document.uri),
        new Promise<undefined>(resolve => { timeout = setTimeout(() => resolve(undefined), 800); }),
      ]);
      if (generation !== this.generation || document.version !== version || this.disposed) return;
      const value = this.flattenSymbols(result ?? [], document);
      this.symbols.set(key, { version, time: Date.now(), value });
      this.trimCache(this.symbols);
      if (value.length) render(value);
    } catch {
      // The lexical scanner is sufficient when rust-analyzer is absent or busy.
    } finally { if (timeout) clearTimeout(timeout); }
  }

  private flattenSymbols(result: (vscode.DocumentSymbol | vscode.SymbolInformation)[], document: vscode.TextDocument): SymbolContext[] {
    const flattened: SymbolContext[] = [];
    const walk = (symbol: vscode.DocumentSymbol | vscode.SymbolInformation) => {
      if (flattened.length >= 500) return;
      const range = 'range' in symbol ? symbol.range : symbol.location.range;
      flattened.push({ name: symbol.name.slice(0, 150), kind: symbol.kind,
        start: document.offsetAt(range.start), end: document.offsetAt(range.end) });
      if ('children' in symbol) for (const child of symbol.children) walk(child);
    };
    for (const symbol of result) walk(symbol);
    return flattened;
  }

  private settings(): { debounceMs: number; maxCards: number } {
    const config = this.configuration();
    const number = (key: string, fallback: number, min: number, max: number) => {
      const inspected = config.inspect<number>(key);
      // Use this build's default when the host still has an older manifest registered.
      // Explicit preferences, including language and folder overrides, remain authoritative.
      const configured = inspected && [inspected.globalValue, inspected.workspaceValue, inspected.workspaceFolderValue,
        inspected.globalLanguageValue, inspected.workspaceLanguageValue, inspected.workspaceFolderLanguageValue]
        .some(value => value !== undefined);
      const value = configured ? config.get<number>(key, fallback) : fallback;
      return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value))) : fallback;
    };
    return { debounceMs: number('debounceMs', 350, 100, 2000), maxCards: number('maxCards', 12, 3, 30) };
  }

  private configuration(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('syntaxiser', vscode.window.activeTextEditor?.document);
  }

  private async setCardCount(count: number): Promise<void> {
    const config = this.configuration();
    const values = config.inspect<number>('maxCards');
    const language = values?.workspaceFolderLanguageValue !== undefined || values?.workspaceLanguageValue !== undefined
      || values?.globalLanguageValue !== undefined;
    const target = values?.workspaceFolderValue !== undefined || values?.workspaceFolderLanguageValue !== undefined
      ? vscode.ConfigurationTarget.WorkspaceFolder
      : values?.workspaceValue !== undefined || values?.workspaceLanguageValue !== undefined
        ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    try {
      await config.update('maxCards', count, target, language);
      if (this.disposed) return;
      this.publish({ pageSize: this.settings().maxCards });
      this.schedule(true);
    } catch (error) {
      void vscode.window.showErrorMessage(`Syntaxiser could not save the card count: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private trimCache<T>(cache: Map<string, T>): void {
    while (cache.size > 20) cache.delete(cache.keys().next().value!);
  }

  private publish(patch: Partial<SidebarState>): void {
    this.state = { ...this.state, ...patch };
    this.sidebar.update(this.state);
  }

  dispose(): void {
    this.disposed = true; this.generation++;
    if (this.timer) clearTimeout(this.timer);
    for (const subscription of this.subscriptions) subscription.dispose();
    this.edits.clear(); this.symbols.clear();
  }
}
