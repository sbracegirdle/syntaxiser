// Refresh landing-page assets with the production sidebar, catalog and retrieval.
// Run after pnpm compile and pnpm --dir playground/web install --frozen-lockfile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { pathToFileURL } = require('node:url');
const { chromium } = require('../playground/web/node_modules/playwright');
const { validatePack } = require('../out/core/pack');
const { Retriever } = require('../out/core/retrieval');
const { rustAdapter } = require('../out/languages/rust');
const root = path.resolve(__dirname, '..');
const pack = validatePack({ ...require('../packs/rust.json'), referenceTopics: require('../packs/rust-reference.json') });
const retriever = new Retriever(pack);
// The hero's editor excerpt, with the cursor immediately after .iter().
const source = 'fn main() {\n    let values = vec![1, 2, 3, 4];\n    let iter = values.iter();\n}';
const context = rustAdapter.extract({ text: source, offset: source.indexOf('.iter()') + 7, recentEdits: [], symbols: [] });
const relevant = retriever.relevant(context, 60).map(result => result.card);
const state = { type: 'state', reference: pack, languageId: 'rust', language: 'Rust', scope: context.scope,
  relevant, suggestedTopics: retriever.relevantTopics(context, 2), search: [], query: '', message: '', pageSize: 12,
  pins: [], pinsCollapsed: false };
const originalLoad = Module._load;
let sidebar;
try {
  Module._load = function(name, ...args) {
    if (name === 'vscode') return { Uri: { joinPath: path.join } };
    return originalLoad.call(this, name, ...args);
  };
  const { ReferenceSidebar } = require('../out/sidebar');
  sidebar = new ReferenceSidebar(root, () => {}, () => {}, () => {}, () => {});
} finally { Module._load = originalLoad; }
const disposable = () => ({ dispose() {} });
const webview = { asWebviewUri: value => value, cspSource: '', onDidReceiveMessage: disposable, postMessage() {} };
sidebar.resolveWebviewView({ webview, onDidChangeVisibility: disposable, onDidDispose: disposable });
// Only the VS Code host bridge, resource paths and theme variables are supplied.
// All visible markup, layout, controls and code come from the real renderer.
const theme = `:root { --vscode-foreground:#cccccc; --vscode-sideBar-background:#181818;
 --vscode-editor-background:#1f1f1f; --vscode-editor-foreground:#d4d4d4;
 --vscode-descriptionForeground:#9d9d9d; --vscode-widget-border:#454545;
 --vscode-input-background:#313131; --vscode-input-foreground:#cccccc;
 --vscode-input-placeholderForeground:#989898; --vscode-dropdown-background:#313131;
 --vscode-dropdown-foreground:#cccccc; --vscode-focusBorder:#0078d4;
 --vscode-textLink-foreground:#4daafc; --vscode-button-secondaryBackground:#313131;
 --vscode-button-secondaryForeground:#cccccc; --vscode-editor-font-family:Consolas,monospace;
 --vscode-editor-font-size:12px; --vscode-font-size:13px; }`;
let html = webview.html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>${theme}\n${fs.readFileSync(path.join(root, 'media/sidebar.css'), 'utf8')}</style>`)
  .replace(/<script nonce="[^"]*" src="([^"]+)"><\/script>/g,
    (_, file) => `<script>${fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace('<body>', '<body class="vscode-dark"><script>window.acquireVsCodeApi = () => ({ getState() {}, setState() {}, postMessage() {} });</script>');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 540, height: 740 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent(html);
    const send = data => page.evaluate(data => window.dispatchEvent(new MessageEvent('message', { data })), data);
    await send(state);
    assert.equal(await page.locator('#context-tab').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#query').inputValue(), '');
    assert.equal(await page.locator('#relevant .card').first().getAttribute('aria-label'), relevant[0].title);
    assert.equal(await page.locator('#relevant .card pre code').first().textContent(), relevant[0].code);
    const assets = path.join(root, 'website/assets');
    await page.screenshot({ path: path.join(assets, 'context.png') });
    const query = 'handle a missing value';
    const search = retriever.search(query, 60).map(result => result.card);
    const searchState = { ...state, query, search, searchTopics: retriever.searchTopics(query) };
    await page.locator('#query').fill(query);
    await page.locator('#query').press('Enter');
    await send(searchState);
    assert.equal(await page.locator('#search-section').isVisible(), true);
    await page.screenshot({ path: path.join(assets, 'search.png') });
    await send({ ...searchState, pins: search.slice(0, 2).map(card => ({ languageId: 'rust', card, collapsed: true })) });
    assert.equal(await page.locator('#pinned .card').count(), 2);
    await page.screenshot({ path: path.join(assets, 'pins.png') });
    console.log('Context cards:', relevant.slice(0, 3).map(card => card.id).join(', '));

    // Check the static site with scripts disabled, including narrow/zoom-like widths.
    const site = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    await site.goto(pathToFileURL(path.join(root, 'website/index.html')).href);
    assert.equal((await site.locator('.context-example code').textContent()).replace('│', ''), source,
      'The displayed editor context must match the input used to retrieve the captured cards.');
    for (const width of [320, 390, 768, 1024, 1440]) {
      await site.setViewportSize({ width, height: 1000 });
      // Playwright evaluation still works with page scripts disabled.
      assert.ok(await site.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow at ${width}px`);
      if (width === 390 || width === 1440) await site.screenshot({ path: path.join(root, `docs/screenshots/website-${width === 390 ? 'mobile' : 'desktop'}.png`), fullPage: true });
    }
    await site.locator('.hero').screenshot({ path: path.join(root, 'docs/screenshots/website-hero.png') });
    await site.keyboard.press('Tab');
    assert.equal(await site.locator('.skip').evaluate(node => node === document.activeElement), true);
    await site.locator('summary').first().focus();
    await site.keyboard.press('Enter');
    assert.equal(await site.locator('details').first().getAttribute('open'), '');
    for (const image of await site.locator('img').all()) assert.ok(await image.evaluate(node => node.complete && node.naturalWidth > 0));
    assert.deepEqual(errors, []);
    console.log('Renderer captures and static-site checks passed.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
