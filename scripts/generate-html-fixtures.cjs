// Optional manual fixtures, generated directly from the practical catalog.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../playground/web');
const cards = require('../packs/html.json').cards;
const { documentFor, dependencies } = require('./html-fixtures.cjs');
const files = dependencies();
fs.mkdirSync(path.join(root, '.catalog'), { recursive: true });
for (const card of cards) {
  const dir = path.join(root, '.catalog', card.id);
  fs.mkdirSync(dir, { recursive: true });
  const html = documentFor(card);
  if (!html.includes(card.code)) throw Error(`Exact source missing: ${card.id}`);
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  for (const [name, [,body]] of Object.entries(files)) fs.writeFileSync(path.join(dir,name),body);
}
fs.writeFileSync(path.join(root, 'catalog.html'), `<!doctype html><html lang="en"><title>Exact HTML cards</title><h1>Exact practical HTML cards</h1><ul>${cards.map(c => `<li><a href="./.catalog/${c.id}/index.html">${c.title}</a></li>`).join('')}</ul></html>`);
console.log('Serve playground/web and open /catalog.html (regenerate after catalog edits).');
