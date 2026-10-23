import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { renderToStringAsync } from 'radi/server';
import { App } from './app';

const style = await readFile(new URL('./style.css', import.meta.url));
const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const path = new URL(request.url!, 'http://localhost').pathname;
    if (path === '/style.css') {
      response.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : style);
    } else if (path === '/') {
      const html = '<!doctype html>' + await renderToStringAsync(<App />);
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : html);
    } else {
      response.writeHead(404).end('Not found');
    }
  } catch (error) {
    console.error(error);
    response.writeHead(500).end('Unable to render page');
  }
});
const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));
