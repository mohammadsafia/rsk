// Accessibility audit: axe-core (WCAG 2.0 / 2.1 / 2.2 A + AA) over every page the app links to, in light and dark,
// English and Arabic. Writes a11y-report.json and exits non-zero when any violation is found.
//
//   pnpm a11y:audit                        # starts the dev server if nothing answers on --base
//   pnpm a11y:audit -- --base http://localhost:5173 --max 300
//   pnpm a11y:audit -- --base http://localhost:3000 --seed api --lang-in path   # a running Next app (next start)
//
// Pages are discovered by following same-site links from "/", so the kit audits its docs and showcase pages and an
// app made from the starter audits its own routes, with nothing to keep in sync.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { seedDemoSession } from '../lib/demo-session.mjs';
import { stripLang, withLang } from '../lib/lang-routes.mjs';
import { isEntry } from '../lib/is-entry.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AXE = require.resolve('axe-core/axe.min.js');

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};
const BASE = arg('base', 'http://localhost:5173');
const MAX_PAGES = Number(arg('max', '400'));
/** How the demo user signs in: localStorage (a Vite app) or a session cookie (a Next app). */
const SEED = arg('seed', 'storage');
/** Where the language lives: storage (a Vite app's i18nextLng) or the path (a Next app's /en/…, /ar/…). */
const LANG_IN = arg('lang-in', 'storage');
const WORKERS = 4;
/** Pages a signed-in visitor never sees (they're sent on): audited signed out. */
const SIGNED_OUT = arg('signed-out', '/auth/login,/auth/forgot-password').split(',').filter(Boolean);
/** Signed-in pages no link reaches (a block's 403 page, say): audited with the ones discovery finds. */
const SIGNED_IN = arg('signed-in', '').split(',').filter(Boolean);
const COMBOS = [
  { theme: 'light', lang: 'en' },
  { theme: 'dark', lang: 'en' },
  { theme: 'light', lang: 'ar' },
  { theme: 'dark', lang: 'ar' },
];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * The routes to audit in `lang`: language-free routes as they are when the language lives in storage, each under
 * /{lang} when it lives in the path.
 */
export const routesFor = (routes, lang, langIn) => (langIn === 'path' ? routes.map((route) => withLang(lang, route)) : routes);

/** Discovered routes without their language (a Next app links /en/…), each once. */
export const languageFree = (routes) => [...new Set(routes.map(stripLang))];

/** The discovered routes, then the named ones discovery can't find, each once. */
export const signedInRoutes = (discovered, named) => [...new Set([...discovered, ...named])];

const responds = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

/** Starts `vp dev` when nothing answers on BASE; returns a stop function (a no-op when it was already running). */
async function ensureServer() {
  if (await responds(BASE)) return () => {};
  const port = new URL(BASE).port || '5173';
  // Node runs vp's own entry by absolute path: no PATH lookup, and kill() reaches the server itself, not a wrapper.
  const vp = path.join(path.dirname(require.resolve('vite-plus/package.json')), 'bin/vp');
  // Its own process group: vp starts the dev server as a child, so stopping means stopping the whole group.
  const server = spawn(process.execPath, [vp, 'dev', '--port', port, '--strictPort'], { cwd: ROOT, stdio: 'ignore', detached: true });
  for (let attempt = 0; attempt < 120 && !(await responds(BASE)); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 500));
  if (!(await responds(BASE))) throw new Error(`The dev server did not answer on ${BASE}`);
  return () => {
    try {
      // pid is undefined only if the spawn itself failed; then there is no group to stop.
      if (server.pid !== undefined) process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill();
    }
  };
}

/**
 * Every same-site page reachable from "/" by links (breadth first, up to `max`). A page that redirects is recorded where
 * it lands, and links are resolved against it, so a "/" that redirects into the app still finds the app's pages.
 * `truncated` is true when the cap stopped discovery with pages still unseen.
 */
export async function discoverRoutes(browser, { base, max }) {
  const page = await browser.newPage();
  const origin = new URL(base).origin;
  const seen = new Set(['/']);
  const queue = ['/'];
  let truncated = false;
  const add = (route) => {
    if (seen.has(route)) return;
    if (seen.size >= max) {
      truncated = true;
      return;
    }
    seen.add(route);
    queue.push(route);
  };
  while (queue.length) {
    const route = queue.shift();
    try {
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      // A redirect: the page it landed on is the one to audit.
      const landed = new URL(page.url());
      if (landed.origin === origin && landed.pathname !== route) add(landed.pathname);
      // Pages render their links progressively (lazy routes, docs registry); read them once the count stops changing.
      let links = [];
      for (let stable = 0, previous = -1, tries = 0; stable < 2 && tries < 20; tries += 1) {
        await page.waitForTimeout(250);
        // anchor.href is already resolved against the page, so relative links count too.
        links = await page.$$eval('a[href]', (anchors) => anchors.map((anchor) => anchor.href));
        stable = links.length === previous ? stable + 1 : 0;
        previous = links.length;
      }
      for (const href of links) {
        const url = new URL(href);
        if (url.origin === origin && /^https?:$/.test(url.protocol)) add(url.pathname);
      }
    } catch {
      // A page that fails to load is still audited below, where the error is reported.
    }
  }
  await page.close();
  return { routes: [...seen], truncated };
}

async function audit(context, route) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(600);
    await page.addScriptTag({ path: AXE });
    const violations = await page.evaluate(async (tags) => {
      // eslint-disable-next-line no-undef
      const result = await axe.run(document, { runOnly: { type: 'tag', values: tags } });
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        count: violation.nodes.length,
        nodes: violation.nodes.slice(0, 10).map((node) => ({ target: node.target.join(' '), html: node.html.slice(0, 200) })),
      }));
    }, TAGS);
    return { route, violations };
  } catch (error) {
    return { route, error: String(error).slice(0, 300), violations: [] };
  } finally {
    await page.close();
  }
}

async function main() {
  const stopServer = await ensureServer();
  let browser;
  try {
    browser = await chromium.launch();
    // Signed in as the mock backend's demo user, so the pages behind sign-in are found and audited.
    const discovery = await browser.newContext();
    await seedDemoSession(discovery, { via: SEED, url: BASE });
    const discovered = await discoverRoutes(discovery, { base: BASE, max: MAX_PAGES });
    const { truncated } = discovered;
    const routes = signedInRoutes(LANG_IN === 'path' ? languageFree(discovered.routes) : discovered.routes, SIGNED_IN);
    await discovery.close();
    if (truncated) console.warn(`Stopped discovering at --max ${MAX_PAGES}: some pages are not audited. Raise --max to audit them all.`);
    console.log(`Auditing ${routes.length} pages signed in and ${SIGNED_OUT.length} signed out × ${COMBOS.length} (light/dark × en/ar)…`);
    const results = [];
    for (const combo of COMBOS) {
      for (const [signedIn, list] of [
        [true, routes],
        [false, SIGNED_OUT],
      ]) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
        await context.addInitScript(
          ({ theme, lang, langInStorage }) => {
            localStorage.setItem('rsk-theme', JSON.stringify(theme));
            if (langInStorage) localStorage.setItem('i18nextLng', lang);
          },
          { ...combo, langInStorage: LANG_IN === 'storage' },
        );
        if (signedIn) await seedDemoSession(context, { via: SEED, url: BASE });
        const queue = [...routesFor(list, combo.lang, LANG_IN)];
        await Promise.all(
          Array.from({ length: WORKERS }, async () => {
            while (queue.length) results.push({ ...combo, signedIn, ...(await audit(context, queue.shift())) });
          }),
        );
        await context.close();
      }
    }

    writeFileSync(path.join(ROOT, 'a11y-report.json'), `${JSON.stringify({ truncated, results }, null, 1)}\n`);
    const failures = results.flatMap((result) => result.violations.map((violation) => ({ ...violation, ...result })));
    const errors = results.filter((result) => result.error);
    const byRule = new Map();
    for (const failure of failures)
      byRule.set(failure.id, [...(byRule.get(failure.id) ?? []), `${failure.route} (${failure.theme}/${failure.lang})`]);
    for (const [rule, where] of byRule) console.log(`  ${rule}: ${where.length} × — ${[...new Set(where)].slice(0, 4).join(', ')}`);
    console.log(
      `violations: ${failures.reduce((sum, failure) => sum + failure.count, 0)} across ${results.length} page-states; ${errors.length} pages failed to load`,
    );
    console.log('Full report: a11y-report.json');
    if (failures.length || errors.length) process.exitCode = 1;
  } finally {
    // The server stops even when the browser never launched.
    await browser?.close();
    stopServer();
  }
}

export { isEntry };

// Run only as a script: tests import discoverRoutes without starting a server or a browser.
if (isEntry(import.meta.url, process.argv[1])) await main();
