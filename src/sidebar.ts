import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { ReferenceCard, ReferencePack } from './core/types';
import { LessonAction, LessonLibrary, parseLessonAction } from './core/lessons';

export interface PinnedCard { languageId: string; card: ReferenceCard; collapsed: boolean }
export type PinAction = { action: 'pin' | 'unpin' | 'collapse'; languageId: string; cardId: string; collapsed: boolean }
  | { action: 'collapseAll'; collapsed: boolean };

export interface SidebarState {
  contextVersion?: number;
  lessonLibraries?: LessonLibrary[];
  reference?: ReferencePack;
  languageId: string;
  language: string;
  scope: string;
  relevant: ReferenceCard[];
  suggestedTopics?: string[];
  search: ReferenceCard[];
  searchTopics?: string[];
  query: string;
  message: string;
  pageSize: number;
  pins: PinnedCard[];
  pinsCollapsed: boolean;
}

export class ReferenceSidebar implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private state: SidebarState = { languageId: 'rust', language: 'Rust', scope: '', relevant: [], search: [], query: '', message: 'Open a supported source file to see relevant syntax.', pageSize: 12, pins: [], pinsCollapsed: false };

  constructor(private readonly root: vscode.Uri, private readonly onQuery: (query: string) => void,
    private readonly onVisible: () => void, private readonly onCardCount: (count: number) => void,
    private readonly onPin: (action: PinAction) => void, private readonly onLesson: (action: LessonAction) => void = () => {}) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this.root, 'media')] };
    const nonce = randomBytes(18).toString('base64');
    const css = view.webview.asWebviewUri(vscode.Uri.joinPath(this.root, 'media', 'sidebar.css'));
    const js = view.webview.asWebviewUri(vscode.Uri.joinPath(this.root, 'media', 'sidebar.js'));
    const highlight = view.webview.asWebviewUri(vscode.Uri.joinPath(this.root, 'media', 'highlight.js'));
    const lessons = view.webview.asWebviewUri(vscode.Uri.joinPath(this.root, 'media', 'lessons.js'));
    view.webview.html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${view.webview.cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${css}"><title>Syntaxiser Reference</title></head>
<body>
  <header class="sidebar-toolbar">
  <nav class="view-tabs" aria-label="Reference mode">
    <button id="context-tab" type="button" aria-pressed="true" aria-controls="relevant-section search-section suggested-topics-section">Context</button>
    <button id="reference-tab" type="button" aria-pressed="false" aria-controls="reference-section">Reference</button>
    <button id="lessons-tab" type="button" aria-pressed="false" aria-controls="lessons-section lesson-tracker">Lesson tracker</button>
    <button id="lesson-browser-tab" type="button" aria-pressed="false" aria-controls="lessons-section lesson-browser">Lesson browser</button>
  </nav>
  <div class="sidebar-options"><select id="card-count" aria-label="Cards shown initially" title="Cards shown initially in each section">
    ${[5, 12, 20, 30].map(count => `<option value="${count}"${count === 12 ? ' selected' : ''}>${count} cards</option>`).join('')}
  </select><span id="language" class="language">Rust</span></div>
  </header>
  <section id="lessons-section" aria-labelledby="lessons-heading" hidden>
    <h1 id="lessons-heading">Lesson tracker</h1>
    <div class="lesson-filters">
      <select id="lesson-difficulty" aria-label="Difficulty" title="Difficulty"><option value="all">Level</option><option value="1">1 · First steps</option><option value="2">2 · Beginner</option><option value="3">3 · Intermediate</option><option value="4">4 · Advanced</option><option value="5">5 · Challenging</option></select>
      <select id="lesson-status" aria-label="Filter by status" title="Filter by status"><option value="all">Status</option><option value="untracked">Not tracked</option><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option><option value="hidden">Hidden</option></select>
      <button id="lesson-order" type="button" aria-label="Hardest first" title="Easiest first; click for hardest first">↑</button>
      <button id="lesson-hide-done" type="button" aria-label="Hide done" aria-pressed="false" title="Hide done">✓</button>
      <select id="lesson-category" aria-label="Filter by category" title="Filter by category"><option value="all">Category</option><option value="general">General</option><option value="numbers">Numbers</option><option value="text">Text</option><option value="collections">Collections</option><option value="games">Games</option><option value="files">Files</option><option value="web">Web</option><option value="data">Data</option><option value="tooling">Tooling</option><option value="concurrency">Concurrency</option><option value="testing">Testing</option></select>
    </div>
    <p id="lesson-summary" class="empty" role="status"></p>
    <button id="lesson-new" type="button">+ New lesson</button>
    <button id="lesson-browse" type="button">Browse lessons</button>
    <form id="lesson-form" hidden>
      <h2 id="lesson-form-heading">New lesson</h2>
      <label>Title<input id="lesson-title" required maxlength="120"></label>
      <label>Category<select id="lesson-edit-category"><option value="general">General</option><option value="numbers">Numbers</option><option value="text">Text</option><option value="collections">Collections</option><option value="games">Games</option><option value="files">Files</option><option value="web">Web</option><option value="data">Data</option><option value="tooling">Tooling</option><option value="concurrency">Concurrency</option><option value="testing">Testing</option></select></label>
      <label>Description<textarea id="lesson-instructions" required maxlength="6000" rows="5" placeholder="What would you like to practice? Include code or a completion check if useful."></textarea></label>
      <button type="submit">Save lesson</button><button id="lesson-cancel" type="button">Cancel</button>
      <p id="lesson-form-message" class="empty" role="status"></p>
    </form>
    <div id="lesson-tracker">
      <div id="lesson-list"></div>
      <p id="lesson-empty" class="empty" role="status" hidden>No tracked lessons match these filters. Open Lesson browser to choose a lesson.</p>
    </div>
    <div id="lesson-browser" class="lesson-browser-layout" hidden>
      <nav id="lesson-tree" aria-label="Lessons by difficulty"></nav>
      <section id="lesson-browser-content" aria-labelledby="lesson-selection-heading">
        <h2 id="lesson-selection-heading" class="sr-only" tabindex="-1">Choose a lesson</h2>
        <p id="lesson-browser-message" class="empty" role="status">Choose a lesson from the difficulty tree.</p>
        <div id="lesson-detail"></div>
      </section>
    </div>
    <div class="lesson-reset"><button id="lesson-reset-language" type="button">Reset this language…</button><button id="lesson-reset-all" type="button">Reset all languages…</button></div>
  </section>
  <section id="reference-section" aria-labelledby="reference-heading" hidden>
    <h1 id="reference-heading">Rust reference</h1>
    <div class="reference-layout">
    <nav id="reference-navigation" aria-label="Reference topics">
      <label class="sr-only" for="topic-query">Search topics</label>
      <input id="topic-query" type="search" placeholder="Find topic…" autocomplete="off" maxlength="100">
      <p id="topic-search-message" class="empty" role="status" hidden>No matching topics.</p>
      <div id="reference-topics"></div>
    </nav>
    <div id="reference-content">
    <h2 id="reference-topic-heading" tabindex="-1">Choose a topic</h2>
    <p id="reference-message" class="empty" role="status">Browse a topic to explore its syntax.</p>
    <div id="reference-results" class="cards"></div>
    </div>
    </div>
  </section>
  <form id="search-form" role="search"><label class="sr-only" for="query">Search language concepts</label>
    <input id="query" type="search" placeholder="Search syntax or describe a task" autocomplete="off" spellcheck="false" maxlength="300">
    <div id="search-context-notice" hidden>
      <p role="status">Your context changed. Search is still active.</p>
      <button id="clear-context-search" type="button">Clear search and show context</button>
    </div>
  </form>
  <section id="suggested-topics-section" aria-labelledby="suggested-topics-heading" hidden>
    <div class="section-heading"><h2 id="suggested-topics-heading">Quick reference</h2><span class="hint">SYNTAX FORMS</span></div>
    <div id="suggested-topics" class="quick-references"></div>
  </section>
  <section id="pinned-section" aria-label="Pinned cards" hidden>
    <button id="pins-toggle" class="pins-toggle" type="button" aria-expanded="true" aria-controls="pinned">▾ Pinned (0)</button>
    <div id="pinned" class="cards"></div>
  </section>
  <section id="search-section" class="search-section" aria-labelledby="search-heading" hidden>
    <div class="section-heading"><h2 id="search-heading">Example snippets</h2><span class="hint">SEARCH RESULTS</span></div>
    <p id="search-message" class="empty" role="status"></p>
    <div id="search-results" class="cards"></div>
    <button id="search-more" class="show-more" type="button" aria-controls="search-results" hidden>Show more</button>
  </section>
  <section id="relevant-section" aria-labelledby="relevant-heading">
    <div class="section-heading"><h1 id="relevant-heading">Example snippets</h1><span id="scope"></span></div>
    <p id="context-message" class="empty" role="status">Open a supported source file to see relevant syntax.</p>
    <div id="relevant" class="cards"></div>
    <button id="relevant-more" class="show-more" type="button" aria-controls="relevant" hidden>Show more</button>
  </section>
  <script nonce="${nonce}" src="${highlight}"></script>
  <script nonce="${nonce}" src="${lessons}"></script>
  <script nonce="${nonce}" src="${js}"></script>
</body></html>`;
    const subscriptions = [
      view.webview.onDidReceiveMessage((message: unknown) => {
        if (!message || typeof message !== 'object') return;
        if ((message as { type?: unknown }).type === 'lesson') {
          const action = parseLessonAction(message);
          if (action) this.onLesson(action);
          return;
        }
        const data = message as { type?: unknown; query?: unknown; count?: unknown; action?: unknown;
          languageId?: unknown; cardId?: unknown; collapsed?: unknown };
        if (data.type === 'ready') this.post();
        if (data.type === 'search' && typeof data.query === 'string') this.onQuery(data.query.slice(0, 300));
        if (data.type === 'cardCount' && typeof data.count === 'number' && Number.isInteger(data.count)
          && data.count >= 3 && data.count <= 30) this.onCardCount(data.count);
        if (data.type === 'pin') {
          if (data.action === 'collapseAll' && typeof data.collapsed === 'boolean') {
            this.onPin({ action: 'collapseAll', collapsed: data.collapsed });
          } else if ((data.action === 'pin' || data.action === 'unpin' || data.action === 'collapse')
            && typeof data.languageId === 'string' && typeof data.cardId === 'string'
            && data.languageId.length <= 100 && data.cardId.length <= 200
            && (data.action !== 'collapse' || typeof data.collapsed === 'boolean')) {
            this.onPin({ action: data.action, languageId: data.languageId, cardId: data.cardId, collapsed: data.collapsed === true });
          }
        }
      }),
      view.onDidChangeVisibility(() => { if (view.visible) { this.post(); this.onVisible(); } }),
    ];
    view.onDidDispose(() => {
      for (const subscription of subscriptions) subscription.dispose();
      if (this.view === view) this.view = undefined;
    });
    this.onVisible();
  }

  update(state: SidebarState): void { this.state = state; this.post(); }
  get visible(): boolean { return this.view?.visible ?? false; }
  private post(): void {
    if (this.view?.visible) void this.view.webview.postMessage({ type: 'state', ...this.state });
  }
}
