// Explicit online check; normal builds and tests remain offline.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

async function main() {
  const urls = new Set();
  const companions = JSON.parse(fs.readFileSync(path.join(root, 'packs', 'sql-companions.json'), 'utf8'));
  for (const extra of Object.values(companions)) {
    for (const topic of extra.referenceTopics) for (const reference of topic.references) urls.add(reference.url);
  }
  for (const file of fs.readdirSync(path.join(root, 'packs')).filter(file => file.endsWith('-reference.json'))) {
    for (const topic of JSON.parse(fs.readFileSync(path.join(root, 'packs', file), 'utf8'))) {
      if (!topic.references?.length) throw new Error(`${file}: ${topic.id} needs learning references`);
      for (const reference of topic.references) urls.add(reference.url);
    }
  }
  // Reuse each fetched document when several topic links differ only by fragment.
  const documents = new Map();
  for (const url of urls) {
    const base = new URL(url);
    base.hash = '';
    if (!documents.has(base.href)) documents.set(base.href, []);
    documents.get(base.href).push(url);
  }
  const queue = [...documents];
  const failures = [];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [base, links] = queue.shift();
      try {
        const response = await fetch(base, { signal: AbortSignal.timeout(30000),
          headers: { 'User-Agent': 'Syntaxiser-reference-link-check/1.0' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        for (const url of links) {
          const anchor = decodeURIComponent(new URL(url).hash.slice(1));
          if (anchor && !html.includes(`id="${anchor}"`) && !html.includes(`id='${anchor}'`)
            && !html.includes(`name="${anchor}"`) && !html.includes(`name='${anchor}'`)) {
            failures.push(`${url}: fragment not found in returned HTML`);
          }
        }
        console.log(`OK ${response.status} ${base}${response.url !== base ? ' -> ' + response.url : ''}`);
      } catch (error) { failures.push(`${base}: ${error.message}`); }
    }
  }));
  console.log(`Checked ${urls.size} links across ${documents.size} documents; ${failures.length} failures.`);
  for (const failure of failures) console.error(failure);
  if (failures.length) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
