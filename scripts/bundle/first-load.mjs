// First-load budget: serves a built dist, opens each route in headless Chromium, and sums the gzipped JavaScript the
// browser downloaded. Also checks each page threw nothing and shows no raw i18n key (a dropped side-effect module).
//
//   node scripts/bundle/first-load.mjs --dist dist                 # discover routes from "/" and report
//   node scripts/bundle/first-load.mjs --dist dist --budget 150    # fail a route over 150 KB gz
//   node scripts/bundle/first-load.mjs --dist dist --budget starter --routes /,/dashboard --redirects /=/dashboard --session
//                                      (--session: signed in as the mock backend's demo user)
//   node scripts/bundle/first-load.mjs --url http://localhost:3000 --routes /login --session --seed api --lang-in path
//                                      (a running server, e.g. a Next app's `next start`: signed in through its API, each
//                                      route measured under /en and /ar)
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { chromium } from 'playwright';

import { discoverRoutes } from '../a11y/audit.mjs';
import { seedDemoSession } from '../lib/demo-session.mjs';
import { localizedRoutes } from '../lib/lang-routes.mjs';
import { isEntry } from '../lib/is-entry.mjs';

export { localizedRoutes };

/**
 * The starter's first-load budget per route, in KB of gzipped JS: 200.8 KB measured when the budget was set
 * (2026-10-18), plus ~5%. Raising it is a decision: say why in the commit.
 */
export const BUNDLE_BUDGET_KB = 210;

/**
 * The Next starter's first-load budget per route, in KB of gzipped JS: 290.5 KB measured on /settings when the budget
 * was set (2026-10-25; sign-in 283.9; Next and React alone are ~132), plus ~5%. Raising it is a decision: say why in
 * the commit.
 */
export const NEXT_BUDGET_KB = 306;

/**
 * A Next page with a kit data table (the starter's members example): 406 KB measured when the budget was set
 * (2026-10-25), plus ~5%. The kit table brings its filter widgets (calendar, combobox, date-fns, ~90 KB) whether a
 * table uses them or not; splitting those out would let this budget come down.
 */
export const NEXT_TABLE_BUDGET_KB = 426;

/**
 * --budget: 'starter' is BUNDLE_BUDGET_KB, 'next-starter' NEXT_BUDGET_KB, 'next-table' NEXT_TABLE_BUDGET_KB, a number
 * is itself, absent means report only.
 */
export function resolveBudget(value) {
  if (value === undefined) return undefined;
  if (value === 'starter') return BUNDLE_BUDGET_KB;
  if (value === 'next-starter') return NEXT_BUDGET_KB;
  if (value === 'next-table') return NEXT_TABLE_BUDGET_KB;
  const budget = Number(value);
  if (!Number.isFinite(budget) || budget <= 0) throw new Error(`--budget must be a number of KB or "starter", not "${value}"`);
  return budget;
}

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

/**
 * The file a request maps to inside dist: the asset itself, else index.html (an SPA route). A path that would leave
 * dist (an escaped ../) also gets index.html; a malformed escape gets null (answered 400).
 */
export function resolveFile(dist, url) {
  const root = path.resolve(dist);
  let pathname;
  try {
    pathname = decodeURIComponent((url ?? '/').split('?')[0]);
  } catch {
    return null;
  }
  const file = path.resolve(root, `.${pathname}`);
  const inside = file.startsWith(`${root}${path.sep}`);
  return inside && existsSync(file) && !statSync(file).isDirectory() ? file : path.join(root, 'index.html');
}

/** Serves dist on loopback only: nothing else on the machine or the network can read through it. */
export const serve = (dist) =>
  new Promise((resolve) => {
    const server = createServer((request, response) => {
      const file = resolveFile(dist, request.url);
      if (!file) {
        response.statusCode = 400;
        response.end();
        return;
      }
      response.setHeader('content-type', TYPES[path.extname(file)] ?? 'text/html');
      response.end(readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });

/**
 * Per route: the gzipped JS the browser downloaded to show it, where it landed, page errors and raw keys on it. Serves
 * `dist` itself, or measures the server already running at `url` (scripts gzipped from what it sent).
 */
export async function measureFirstLoad({ dist, url, routes, localesDir, session = false, seed = 'storage', langIn = 'storage' }) {
  const keys = localesDir && existsSync(localesDir) ? localeKeys(localesDir) : new Set();
  const server = url ? null : await serve(dist);
  const base = url ? url.replace(/\/$/, '') : `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    // --session: signed in as the mock backend's demo user, to measure the pages behind sign-in.
    const context = await browser.newContext();
    if (session) await seedDemoSession(context, { via: seed, url: base });
    const list = routes ? localizedRoutes(routes, langIn) : (await discoverRoutes(context, { base, max: 50 })).routes;
    const results = [];
    for (const route of list) {
      const page = await context.newPage();
      // A fresh cache per route: each measures a first visit.
      await page.route('**/*', (route) => route.continue());
      const errors = [];
      // A server-rendered page whose browser render differs (React logs it): the HTML was wrong, then replaced.
      const hydrationErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && /hydrat|did not match/i.test(message.text())) hydrationErrors.push(message.text());
      });
      const scripts = new Map();
      page.on('pageerror', (error) => errors.push(String(error)));
      const reads = [];
      page.on('response', (response) => {
        const { pathname } = new URL(response.url());
        if (!pathname.endsWith('.js')) return;
        if (url) {
          // A running server's own bytes, gzipped the same way as a dist's files.
          reads.push(
            response.body().then(
              (body) => scripts.set(pathname, gzipSync(body).length),
              () => {},
            ),
          );
          return;
        }
        const file = path.join(dist, pathname);
        if (existsSync(file)) scripts.set(pathname, gzipSync(readFileSync(file)).length);
      });
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await Promise.all(reads);
      const text = await page.evaluate(() => document.body.innerText);
      results.push({
        route,
        landed: new URL(page.url()).pathname,
        gzipKb: Math.round(([...scripts.values()].reduce((sum, size) => sum + size, 0) / 1024) * 10) / 10,
        files: [...scripts.keys()],
        errors,
        hydrationErrors,
        rawKeys: rawKeysIn(text, keys),
      });
      await page.close();
    }
    return results;
  } finally {
    await browser.close();
    server?.close();
  }
}

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};

/** --redirects "/=/dashboard,/old=/new": routes expected to land somewhere else. */
export function parseRedirects(value) {
  return Object.fromEntries(
    (value ?? '')
      .split(',')
      .filter(Boolean)
      .map((pair) => pair.split('=')),
  );
}

/**
 * Why a measured route fails: over budget, page errors, raw keys, or (when `redirects` is given, i.e. an explicit
 * route list) landing on another page than the one asked for, so the page meant to be checked never was.
 */
export function failuresOf(result, { budget, redirects }) {
  const expected = redirects?.[result.route] ?? result.route;
  return [
    budget !== undefined && result.gzipKb > budget ? `over ${budget} KB` : '',
    result.errors.length ? `${result.errors.length} errors: ${result.errors[0].slice(0, 120)}` : '',
    result.rawKeys.length ? `raw keys: ${result.rawKeys.slice(0, 5).join(', ')}` : '',
    result.hydrationErrors?.length ? `hydration errors: ${result.hydrationErrors[0].slice(0, 120)}` : '',
    redirects && result.landed !== expected ? `redirected to ${result.landed}` : '',
  ].filter(Boolean);
}

async function main() {
  const url = arg('url');
  const dist = path.resolve(arg('dist', 'dist'));
  const routes = arg('routes')?.split(',');
  const budget = resolveBudget(arg('budget'));
  // Only an explicit route list is held to where each route lands; discovered routes are wherever links lead.
  const redirects = routes ? parseRedirects(arg('redirects')) : undefined;
  const results = await measureFirstLoad({
    dist,
    url,
    routes,
    seed: arg('seed', 'storage'),
    langIn: arg('lang-in', 'storage'),
    localesDir: path.resolve('src/locales/en'),
    session: process.argv.includes('--session'),
  });
  const failed = [];
  for (const result of results) {
    const flags = failuresOf(result, { budget, redirects });
    if (flags.length) failed.push(result);
    console.log(
      `${result.route.padEnd(28)} ${String(result.gzipKb).padStart(7)} KB gz  → ${result.landed}${flags.length ? `  ✗ ${flags.join('; ')}` : ''}`,
    );
  }
  writeFileSync(arg('report', 'first-load-report.json'), `${JSON.stringify({ budget, results }, null, 1)}\n`);
  if (!results.length) console.error('No route was measured.');
  if (!results.length || failed.length) process.exitCode = 1;
}

if (isEntry(import.meta.url, process.argv[1])) await main();
