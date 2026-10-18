// First-load budget: serves a built dist, opens each route in headless Chromium, and sums the gzipped JavaScript the
// browser downloaded. Also checks each page threw nothing and shows no raw i18n key (a dropped side-effect module).
//
//   node scripts/bundle/first-load.mjs --dist dist                 # discover routes from "/" and report
//   node scripts/bundle/first-load.mjs --dist dist --budget 150    # fail a route over 150 KB gz
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { chromium } from 'playwright';

import { discoverRoutes } from '../a11y/audit.mjs';
import { isEntry } from '../lib/is-entry.mjs';

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

/** Every dotted key path in the locale files, with and without its namespace (common.empty.title and empty.title). */
export function localeKeys(dir) {
  const keys = new Set();
  const walk = (value, trail) => {
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) walk(child, [...trail, key]);
    else if (trail.length > 1) keys.add(trail.join('.'));
  };
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const namespace = file.replace(/\.json$/, '');
    const json = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
    walk(json, []);
    walk({ [namespace]: json }, []);
  }
  return keys;
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Raw keys shown as text: a known dotted key path standing on its own (not part of an email, path or longer word). */
export function rawKeysIn(text, keys) {
  return [...keys].filter((key) => new RegExp(`(^|[^\\w.@/-])${escape(key)}(?![\\w.@/-])`).test(text));
}

const serve = (dist) =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      let file = path.join(dist, decodeURIComponent((request.url ?? '/').split('?')[0]));
      if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(dist, 'index.html');
      response.setHeader('content-type', TYPES[path.extname(file)] ?? 'text/html');
      response.end(readFileSync(file));
    });
    server.listen(0, () => resolve(server));
  });

/** Per route: the gzipped JS the browser downloaded to show it, where it landed, page errors and raw keys on it. */
export async function measureFirstLoad({ dist, routes, localesDir }) {
  const keys = localesDir && existsSync(localesDir) ? localeKeys(localesDir) : new Set();
  const server = await serve(dist);
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    const list = routes ?? (await discoverRoutes(browser, { base, max: 50 })).routes;
    const results = [];
    for (const route of list) {
      const page = await browser.newPage();
      const errors = [];
      const scripts = new Map();
      page.on('pageerror', (error) => errors.push(String(error)));
      page.on('response', (response) => {
        const { pathname } = new URL(response.url());
        const file = path.join(dist, pathname);
        if (pathname.endsWith('.js') && existsSync(file)) scripts.set(pathname, gzipSync(readFileSync(file)).length);
      });
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const text = await page.evaluate(() => document.body.innerText);
      results.push({
        route,
        landed: new URL(page.url()).pathname,
        gzipKb: Math.round(([...scripts.values()].reduce((sum, size) => sum + size, 0) / 1024) * 10) / 10,
        files: [...scripts.keys()],
        errors,
        rawKeys: rawKeysIn(text, keys),
      });
      await page.close();
    }
    return results;
  } finally {
    await browser.close();
    server.close();
  }
}

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};

async function main() {
  const dist = path.resolve(arg('dist', 'dist'));
  const routes = arg('routes')?.split(',');
  const budget = arg('budget') ? Number(arg('budget')) : undefined;
  const results = await measureFirstLoad({ dist, routes, localesDir: path.resolve('src/locales/en') });
  for (const result of results) {
    const flags = [
      budget !== undefined && result.gzipKb > budget ? `over ${budget} KB` : '',
      result.errors.length ? `${result.errors.length} errors: ${result.errors[0].slice(0, 120)}` : '',
      result.rawKeys.length ? `raw keys: ${result.rawKeys.slice(0, 5).join(', ')}` : '',
    ].filter(Boolean);
    console.log(
      `${result.route.padEnd(28)} ${String(result.gzipKb).padStart(7)} KB gz  → ${result.landed}${flags.length ? `  ✗ ${flags.join('; ')}` : ''}`,
    );
  }
  writeFileSync(arg('report', 'first-load-report.json'), `${JSON.stringify({ budget, results }, null, 1)}\n`);
  const failed = results.filter(
    (result) => (budget !== undefined && result.gzipKb > budget) || result.errors.length || result.rawKeys.length,
  );
  if (!results.length) console.error('No route was measured.');
  if (!results.length || failed.length) process.exitCode = 1;
}

if (isEntry(import.meta.url, process.argv[1])) await main();
