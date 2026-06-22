import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.argv[2] || 5173);
const root = fileURLToPath(new URL('../dist', import.meta.url));

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4'
};

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname);
  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const target = join(root, safePath);
  if (!target.startsWith(root)) return join(root, 'index.html');
  return existsSync(target) ? target : join(root, 'index.html');
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end('Bad Request');
    return;
  }

  try {
    const filePath = resolvePath(request.url);
    const body = await readFile(filePath);
    const type = contentTypes[extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type });
    response.end(body);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Không đọc được file build.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`KidEDU đang chạy tại http://127.0.0.1:${port}`);
});
