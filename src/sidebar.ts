import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { ReferenceCard } from './core/types';

export interface PinnedCard { languageId: string; card: ReferenceCard; collapsed: boolean }
export type PinAction = { action: 'pin' | 'unpin' | 'collapse'; languageId: string; cardId: string; collapsed: boolean }
  | { action: 'collapseAll'; collapsed: boolean };

export interface SidebarState {
  languageId: string;
  language: string;
  scope: string;
  relevant: ReferenceCard[];
  search: ReferenceCard[];
  query: string;
  message: string;
  pageSize: number;
  pins: PinnedCard[];
  pinsCollapsed: boolean;
}

export class ReferenceSidebar implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private state: SidebarState = { languageId: 'rust', language: 'Rust', scope: '', relevant: [], search: [], query: '', message: 'Open a Rust file to see relevant syntax.', pageSize: 12, pins: [], pinsCollapsed: false };

  constructor(private readonly root: vscode.Uri, private readonly onQuery: (query: string) => void,
    private readonly onVisible: () => void, private readonly onCardCount: (count: number) => void,
    private readonly onPin: (action: PinAction) => void) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this.root, 'media')] };
    const nonce = randomBytes(18).toString('base64');
    const css = view.webview.asWebviewUri(vscode.Uri.joinPath(this.root, 'media', 'sidebar.css'));
    const js = view.webview.asWebviewUri(vscode.Uri.joinPath(this.root, 'media', 'sidebar.js'));
    const highlight = view.webview.asWebviewUri(vscode.Uri.joinPath(this.root, 'media', 'highlight.js'));
    view.webview.html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${view.webview.cspSource}; script-src 'nonce-${nonce}';">
<link rel="stylesheet" href="${css}"><title>Syntaxiser Reference</title></head>
<body>
  <header><span class="brand">SYNTAXISER</span><select id="card-count" aria-label="Cards shown initially" title="Cards shown initially in each section">
    ${[5, 12, 20, 30].map(count => `<option value="${count}"${count === 12 ? ' selected' : ''}>${count} cards</option>`).join('')}
  </select><span id="language" class="language">Rust</span></header>
  <form id="search-form" role="search"><label class="sr-only" for="query">Search language concepts</label>
    <input id="query" type="search" placeholder="Try “handle a missing value”" autocomplete="off" spellcheck="false" maxlength="300">
  </form>
  <section id="pinned-section" aria-label="Pinned cards" hidden>
    <button id="pins-toggle" class="pins-toggle" type="button" aria-expanded="true" aria-controls="pinned">▾ Pinned (0)</button>
    <div id="pinned" class="cards"></div>
  </section>
  <section id="search-section" class="search-section" aria-labelledby="search-heading" hidden>
    <div class="section-heading"><h2 id="search-heading">Search results</h2><span class="hint">LOCAL</span></div>
    <p id="search-message" class="empty" role="status"></p>
    <div id="search-results" class="cards"></div>
    <button id="search-more" class="show-more" type="button" aria-controls="search-results" hidden>Show more</button>
  </section>
  <section id="relevant-section" aria-labelledby="relevant-heading">
    <div class="section-heading"><h1 id="relevant-heading">Relevant now</h1><span id="scope"></span></div>
    <p id="context-message" class="empty" role="status">Open a Rust file to see relevant syntax.</p>
    <div id="relevant" class="cards"></div>
    <button id="relevant-more" class="show-more" type="button" aria-controls="relevant" hidden>Show more</button>
  </section>
  <script nonce="${nonce}" src="${highlight}"></script>
  <script nonce="${nonce}" src="${js}"></script>
</body></html>`;
    const subscriptions = [
      view.webview.onDidReceiveMessage((message: unknown) => {
        if (!message || typeof message !== 'object') return;
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
