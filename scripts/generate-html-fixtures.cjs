// Optional manual fixtures, generated directly from the practical catalog.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../playground/web');
const cards = require('../packs/html.json').cards;
fs.mkdirSync(path.join(root, '.catalog'), { recursive: true });
for (const card of cards) {
  const dir = path.join(root, '.catalog', card.id);
  fs.mkdirSync(dir, { recursive: true });
  const css = card.id === 'bootstrap' ? '<link rel="stylesheet" href="../../node_modules/bootstrap/dist/css/bootstrap.min.css">' : card.id === 'tailwind' ? '<link rel="stylesheet" href="../../generated.css">' : '';
  const code = card.id === 'inputs' ? `<form>${card.code}<button>Submit fixture</button></form>` : card.code;
  const html = card.id === 'document' ? code : `<!doctype html><html lang="en"><head><meta charset="utf-8">${css}</head><body>${code}</body></html>`;
  if (!html.includes(card.code)) throw Error(`Exact source missing: ${card.id}`);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  if (card.id === 'assets') {
    fs.writeFileSync(path.join(dir, 'styles.css'), 'body { --fixture-loaded: yes; }');
    fs.writeFileSync(path.join(dir, 'app.js'), 'document.documentElement.dataset.moduleLoaded = "yes";');
  }
  if (card.id === 'images') fs.copyFileSync(path.join(root, 'seedling.svg'), path.join(dir, 'seedling.svg'));
}
fs.writeFileSync(path.join(root, 'catalog.html'), `<!doctype html><html lang="en"><title>Exact HTML cards</title><h1>Exact practical HTML cards</h1><ul>${cards.map(c => `<li><a href="./.catalog/${c.id}/index.html">${c.title}</a></li>`).join('')}</ul></html>`);
console.log('Serve playground/web and open /catalog.html (regenerate after catalog edits).');
