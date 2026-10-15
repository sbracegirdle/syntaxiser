// Local preview only. Serves website/ on loopback; no deployment or build step.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const files = new Set(['index.html', 'styles.css', 'assets/book.svg', 'assets/context.png', 'assets/search.png', 'assets/pins.png']);
http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.slice(1) || 'index.html';
  if (!files.has(name) || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404).end('Not found');
    return;
  }
  fs.readFile(path.join(__dirname, name), (error, content) => {
    if (error) { res.writeHead(500).end('Could not read preview file'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(name)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  });
}).listen(4188, '127.0.0.1', () => console.log('Website preview: http://127.0.0.1:4188'));
