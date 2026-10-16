// Shared surroundings and local dependencies for automated and manual exact-card fixtures.
const fs = require('node:fs');
const path = require('node:path');
const web = path.resolve(__dirname, '../playground/web');
function documentFor(card, code = card.code) {
  if (/^<!doctype/i.test(code)) return code;
  const fragment = card.id === 'inputs' ? `<form>${code}<button>Submit fixture</button></form>` : code;
  const css = card.topics[0] === 'bootstrap' ? '<link rel="stylesheet" href="./bootstrap.css">' : card.topics[0] === 'tailwind' ? '<link rel="stylesheet" href="./tailwind.css">' : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${card.title}</title>${css}</head><body>${fragment}</body></html>`;
}
function dependencies() {
  const file = (name, type) => [type, fs.readFileSync(path.join(web, name))];
  return {
    'styles.css': ['text/css', 'body { --fixture-loaded: yes; }'],
    'app.js': ['text/javascript', 'document.documentElement.dataset.moduleLoaded = "yes";'],
    'deferred.js': ['text/javascript', 'document.querySelector("#deferred-action").addEventListener("click", () => { document.querySelector("#deferred-status").textContent = "Ready"; });'],
    'optional-tools.js': ['text/javascript', 'export const label = "Tools ready";'],
    'async-widget.js': ['text/javascript', 'document.querySelector("#weather").textContent = "Weather widget ready";'],
    'seedling.svg': file('seedling.svg', 'image/svg+xml'),
    'small.svg': file('fixtures/small.svg', 'image/svg+xml'),
    'large.svg': file('fixtures/large.svg', 'image/svg+xml'),
    'wide.svg': file('fixtures/wide.svg', 'image/svg+xml'),
    'garden.wav': file('fixtures/garden.wav', 'audio/wav'),
    'garden.webm': file('fixtures/garden.webm', 'video/webm'),
    'captions.vtt': file('fixtures/captions.vtt', 'text/vtt'),
    'transcript.html': file('fixtures/transcript.html', 'text/html'),
    'frame.html': file('fixtures/frame.html', 'text/html'),
    'bootstrap.css': file('node_modules/bootstrap/dist/css/bootstrap.min.css', 'text/css'),
    'tailwind.css': file('generated.css', 'text/css')
  };
}
module.exports = { documentFor, dependencies };
