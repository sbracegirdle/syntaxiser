// Development-only, loopback static server for this playground.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.vtt':'text/vtt', '.webm':'video/webm', '.wav':'audio/wav' };
http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/upload') {
    // Disposable demonstration only: bounded bytes, no storage, no real file validation.
    const chunks = []; let size = 0;
    request.on('data', chunk => { size += chunk.length; if (size > 1024 * 1024) request.destroy(); else chunks.push(chunk); });
    request.on('end', () => {
      const text = Buffer.concat(chunks).toString();
      const accepted = /Content-Type: (?:image\/png|text\/plain)/i.test(text) && !/Content-Type: application\/x-bad/i.test(text);
      response.writeHead(accepted ? 200 : 415, {'Content-Type':'text/plain'}).end(accepted ? 'Upload accepted locally' : 'File type rejected locally');
    });
    return;
  }
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname)); }
  catch { response.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  if (file === root) file = path.join(root, 'index.html');
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(body);
  });
}).listen(4173, '127.0.0.1', () => console.log('Open http://127.0.0.1:4173'));
