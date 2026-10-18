// Accessibility audit: axe-core (WCAG 2.0 / 2.1 / 2.2 A + AA) over every page the app links to, in light and dark,
// English and Arabic. Writes a11y-report.json and exits non-zero when any violation is found.
//
//   pnpm a11y:audit                        # starts the dev server if nothing answers on --base
//   pnpm a11y:audit -- --base http://localhost:5173 --max 300
//
// Pages are discovered by following same-site links from "/", so the kit audits its docs and showcase pages and an
// app made from the starter audits its own routes, with nothing to keep in sync.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const AXE = require.resolve('axe-core/axe.min.js');

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
};
const BASE = arg('base', 'http://localhost:5173');
const MAX_PAGES = Number(arg('max', '400'));
const WORKERS = 4;
const COMBOS = [
  { theme: 'light', lang: 'en' },
  { theme: 'dark', lang: 'en' },
  { theme: 'light', lang: 'ar' },
  { theme: 'dark', lang: 'ar' },
];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

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

/** Every same-site page reachable from "/" by links (breadth first, up to MAX_PAGES). */
async function discoverRoutes(browser) {
  const page = await browser.newPage();
  const seen = new Set(['/']);
  const queue = ['/'];
  while (queue.length && seen.size < MAX_PAGES) {
    const route = queue.shift();
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      // Pages render their links progressively (lazy routes, docs registry); read them once the count stops changing.
      let links = [];
      for (let stable = 0, previous = -1, tries = 0; stable < 2 && tries < 20; tries += 1) {
        await page.waitForTimeout(250);
        links = await page.$$eval('a[href^="/"]', (anchors) => anchors.map((anchor) => anchor.getAttribute('href') ?? ''));
        stable = links.length === previous ? stable + 1 : 0;
        previous = links.length;
      }
      for (const href of links) {
        const clean = href.split('#')[0].split('?')[0];
        if (clean && !seen.has(clean) && seen.size < MAX_PAGES) {
          seen.add(clean);
          queue.push(clean);
        }
      }
    } catch {
      // A page that fails to load is still audited below, where the error is reported.
    }
  }
  await page.close();
  return [...seen];
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

const stopServer = await ensureServer();
const browser = await chromium.launch();
try {
  const routes = await discoverRoutes(browser);
  console.log(`Auditing ${routes.length} pages × ${COMBOS.length} (light/dark × en/ar)…`);
  const results = [];
  for (const combo of COMBOS) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ theme, lang }) => {
      localStorage.setItem('vite-ui-theme', JSON.stringify(theme));
      localStorage.setItem('i18nextLng', lang);
    }, combo);
    const queue = [...routes];
    await Promise.all(
      Array.from({ length: WORKERS }, async () => {
        while (queue.length) results.push({ ...combo, ...(await audit(context, queue.shift())) });
      }),
    );
    await context.close();
  }

  writeFileSync(path.join(ROOT, 'a11y-report.json'), `${JSON.stringify(results, null, 1)}\n`);
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
  await browser.close();
  stopServer();
}
