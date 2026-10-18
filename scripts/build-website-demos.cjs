// Deterministic snapshot of the actual extension renderer and browser host.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const old = Module._load;
let Sidebar;
try {
  Module._load = function(name, ...args) { return name === 'vscode' ? { Uri: { joinPath: path.join } } : old.call(this, name, ...args); };
  Sidebar = require('../out/sidebar').ReferenceSidebar;
} finally { Module._load = old; }
const disposable = () => ({ dispose() {} });
const webview = { asWebviewUri: value => value, cspSource: '', onDidReceiveMessage: disposable, postMessage() {} };
new Sidebar(root, () => {}, () => {}, () => {}, () => {}).resolveWebviewView({ webview, onDidChangeVisibility: disposable, onDidDispose: disposable });
// LessonStore only needs randomUUID from Node; use the browser's equivalent.
const cryptoShim = path.join(root, 'scripts/website-crypto.ts');
const bundle = buildSync({ entryPoints: [path.join(root, 'scripts/website-demo-host.ts')], bundle: true, platform: 'browser', write: false, minify: true, alias: { 'node:crypto': cryptoShim } }).outputFiles[0].text;
const theme = read('scripts/capture-website.cjs').match(/const theme = `([\s\S]*?)`;/)[1];
const editorCss = '.demo-editor{padding:12px;border-bottom:1px solid #454545;background:#1f1f1f}.demo-editor p{font-size:11px;color:#9d9d9d;margin:0 0 8px}.demo-editor pre{height:100px;overflow:auto;white-space:pre;margin:0 0 8px;color:#d4d4d4}.demo-editor button{margin-right:8px}.demo-editor code{font-family:Consolas,monospace}';
let html = webview.html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>${theme}\n${read('media/sidebar.css')}\n${editorCss}</style>`)
  .replace(/<script nonce="[^"]*" src="([^"]+)"><\/script>/g, (_, file) => `<script>${fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace('<body>', `<body class="vscode-dark"><script>${bundle.replace(/<\/script/gi, '<\\/script')}</script>`);
const file = path.join(root, 'website/assets/demo.html');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) throw Error('Website demo is stale. Run node scripts/build-website-demos.cjs after pnpm compile.');
  console.log('Demo matches production markup, CSS, scripts, Rust retrieval/catalog and lessons.');
} else { fs.writeFileSync(file, html); console.log('Generated website/assets/demo.html'); }
