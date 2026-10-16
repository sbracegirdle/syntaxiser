const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const cards = JSON.parse(readFileSync(join(__dirname, '../../../packs/typescript.json'), 'utf8')).cards;
const ids = require('./depth-cards.json');
const target = join(__dirname, '.catalog-depth');
mkdirSync(target, { recursive: true });
for (const id of ids) {
  const card = cards.find(card => card.id === id);
  if (!card) throw new Error('Missing depth card: ' + id);
  // Exact catalog bytes, with a module marker only; no rewritten implementations.
  writeFileSync(join(target, id + '.tsx'), 'export {};\n' + card.code + '\n');
}
console.log(`Prepared ${ids.length} exact TypeScript depth examples.`);
