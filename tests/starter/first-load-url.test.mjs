// tests/starter/first-load-url.test.mjs — first-load.mjs against a running server (a Next app's `next start`), in a real
// browser. Repo-only: an app's own `vp test` must not need Playwright's browsers.
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { measureFirstLoad } from '../../scripts/bundle/first-load.mjs';

// Varied text, so its gzipped size is well above zero.
const SCRIPT = Array.from({ length: 4000 }, (_, index) => `window.v${index} = ${(index * 7919) % 104729};`).join('\n');
const PAGE = '<!doctype html><html><head><script src="/app.js"></script></head><body><p>Page</p></body></html>';

let server;
const cookies = [];
const logins = [];

const start = () =>
  new Promise((resolve) => {
    server = createServer((request, response) => {
      if (request.url === '/app.js') {
        response.setHeader('content-type', 'text/javascript');
        response.end(SCRIPT);
        return;
      }
      if (request.method === 'POST' && request.url === '/api/auth/login') {
        let body = '';
        request.on('data', (chunk) => (body += chunk));
        request.on('end', () => {
          logins.push({ body: JSON.parse(body), origin: request.headers.origin, type: request.headers['content-type'] });
          response.setHeader('set-cookie', 'rsk_session=sealed; Path=/; HttpOnly');
          response.end('{}');
        });
        return;
      }
      cookies.push(request.headers.cookie ?? '');
      response.setHeader('content-type', 'text/html');
      response.end(PAGE);
    });
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`));
  });

afterEach(() => {
  server?.close();
  cookies.length = 0;
  logins.length = 0;
});

describe('first-load against a running server', () => {
  it('sums the gzipped JavaScript a page loads from --url, without a dist', async () => {
    const url = await start();
    const [result] = await measureFirstLoad({ url, routes: ['/'] });
    expect(result.files).toEqual(['/app.js']);
    expect(result.gzipKb).toBe(Math.round((gzipSync(Buffer.from(SCRIPT)).length / 1024) * 10) / 10);
    expect(result.gzipKb).toBeGreaterThan(1);
  });

  it('signs in through the app’s own sign-in endpoint, when --seed api, so the server’s cookie comes with each page', async () => {
    const url = await start();
    await measureFirstLoad({ url, routes: ['/'], session: true, seed: 'api' });
    expect(logins).toEqual([{ body: { email: 'demo@example.com', password: 'demo-password' }, origin: url, type: 'application/json' }]);
    expect(cookies.at(-1)).toMatch(/(^|; )rsk_session=sealed/);
  });

  it('measures each route under each language with --lang-in path', async () => {
    const url = await start();
    const results = await measureFirstLoad({ url, routes: ['/', '/dashboard'], langIn: 'path' });
    expect(results.map((result) => result.route)).toEqual(['/en', '/en/dashboard', '/ar', '/ar/dashboard']);
  });
});
