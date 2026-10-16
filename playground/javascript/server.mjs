import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export function startServer(port = 4174) {
  const server = createServer(async (req, res) => {
    if (req.url === '/status') { res.end('Ready'); return; }
    if (req.url === '/slow') { const timer = setTimeout(() => res.end('Stale'), 2000); res.on('close', () => clearTimeout(timer)); return; }
    if (req.url === '/fail') { res.writeHead(503); res.end('Unavailable'); return; }
    if (req.url?.startsWith('/depth')) {
      if (req.url === '/depth.js') {
        res.setHeader('content-type', 'text/javascript');
        try { res.end(await readFile(new URL('dist/depth.js', import.meta.url))); }
        catch { res.writeHead(500); res.end('Build the playground first'); }
      } else {
        res.setHeader('content-type', 'text/html');
        res.end(await readFile(new URL('depth.html', import.meta.url)));
      }
      return;
    }
    const asset = req.url?.startsWith('/browser.js') ? ['dist/browser.js','text/javascript'] : ['index.html','text/html'];
    try { res.setHeader('content-type', asset[1]); res.end(await readFile(new URL(asset[0], import.meta.url))); }
    catch { res.writeHead(500); res.end('Build the playground first'); }
  });
  return server.listen(port, '127.0.0.1');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) startServer().on('listening', () => console.log('Playground: http://127.0.0.1:4174'));
