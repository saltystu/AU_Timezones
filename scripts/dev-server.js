import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 3000);

createServer(async (request, response) => {
  const requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const filename = resolve(root, '.' + (requested === '/' ? '/index.html' : requested));
  if (filename !== root && !filename.startsWith(root + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const data = await readFile(filename);
    response.writeHead(200, { 'Content-Type': mime[extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(data);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Local preview: http://localhost:${port}`));
