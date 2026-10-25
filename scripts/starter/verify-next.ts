/**
 * Proves the Next starter stands on its own: builds it, installs, then type-checks, lints and tests it, builds it
 * (without its secret, and checks no server value reaches the browser's files), serves it and checks the HTML and the
 * redirects a person meets, measures each page's first load, runs the accessibility audit and walks through sign-in,
 * a language switch and sign-out in a real browser.
 *
 *   pnpm starter:verify -- --target next
 */
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { chromium, type Page } from 'playwright';

import { buildStarter, refreshLockfile } from './build-starter';
import { installArgs } from './install';
import { LEFTOVER_PATTERNS } from './manifest';

const PORT = 5410;
const BASE = `http://127.0.0.1:${PORT}`;
const pnpm = ['pnpm@10.34.7'];
const SENTINEL = `rsk-sentinel-${randomBytes(6).toString('hex')}`;

const run = (cwd: string, args: string[], env: NodeJS.ProcessEnv = {}) => {
  console.log(`\n$ corepack ${[...pnpm, ...args].join(' ')}`);
  execFileSync('corepack', [...pnpm, ...args], { cwd, stdio: 'inherit', env: { ...process.env, CI: '1', ...env } });
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const check = (ok: unknown, message: string) => {
  if (!ok) throw new Error(`verify-next: ${message}`);
  console.log(`  ✓ ${message}`);
};

/** `next start` in its own process group, answering on BASE; the stop function ends the whole group. */
async function serve(cwd: string, env: NodeJS.ProcessEnv): Promise<() => void> {
  const server = spawn('corepack', [...pnpm, 'exec', 'next', 'start', '-p', String(PORT)], {
    cwd,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, ...env },
  });
  const stop = () => {
    try {
      if (server.pid) process.kill(-server.pid);
    } catch {
      // Already gone.
    }
  };
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      if ((await fetch(`${BASE}/en/login`)).ok) return stop;
    } catch {
      // Not answering yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  stop();
  throw new Error('verify-next: next start did not answer');
}

/** A request as the browser sends it, the redirect not followed. */
const get = (route: string, headers: Record<string, string> = {}) => fetch(`${BASE}${route}`, { redirect: 'manual', headers });
const locationOf = (response: Response) => {
  const location = response.headers.get('location');
  return location ? new URL(location, BASE).pathname + new URL(location, BASE).search : null;
};

async function checkPages(app: string) {
  check(locationOf(await get('/', { 'Accept-Language': 'en;q=0.2, ar;q=0.9' })) === '/ar', '/ goes to /ar for an Arabic browser');
  check(locationOf(await get('/en')) === '/en/dashboard', '/en opens the app');
  const guarded = await get('/en/dashboard');
  check(
    guarded.status === 307 && locationOf(guarded) === '/en/login?next=%2Fen%2Fdashboard',
    'a signed-out visitor is sent to sign in, with ?next=',
  );

  const garbage = await get('/en/dashboard', { cookie: 'rsk_session=garbage' });
  check(locationOf(garbage) === '/en/login?next=%2Fen%2Fdashboard', 'a damaged session cookie counts as signed out');
  check(/rsk_session=;.*Max-Age=0/i.test(garbage.headers.get('set-cookie') ?? ''), '…and is cleared');
  check((await get('/en/login', { cookie: 'rsk_session=garbage' })).status === 200, '…without a redirect loop');

  const login = await get('/ar/login');
  const html = await login.text();
  const arAuth = JSON.parse(readFileSync(path.join(app, 'src/locales/ar/auth.json'), 'utf8')) as { login: { title: string } };
  check(login.status === 200 && html.includes('<html lang="ar" dir="rtl"'), '/ar/login is server-rendered right to left');
  check(html.includes(`<title>${arAuth.login.title} · RSK</title>`), '…with an Arabic title');
  check(html.includes(arAuth.login.title) && html.includes('demo@example.com'), '…its heading and the demo account in the HTML');

  const unknown = await get('/ar/no-such-page');
  check(
    unknown.status === 404 && (await unknown.text()).includes('<html lang="ar" dir="rtl"'),
    'an unknown URL is a 404 page in its language',
  );
  check(locationOf(await get('/fr/x')) === '/en/fr/x', 'a language the app lacks gets the default in front (then a 404)');

  const foreign = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://evil.example' },
    body: JSON.stringify({ email: 'demo@example.com', password: 'demo-password' }),
  });
  check(foreign.status === 403, 'sign-in refuses a request from another site');
}

async function signIn(page: Page, route: string) {
  await page.goto(`${BASE}${route}`);
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Password').fill('demo-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function checkInBrowser(app: string) {
  const browser = await chromium.launch();
  const problems: string[] = [];
  try {
    const context = await browser.newContext();
    const watch = (page: Page) => {
      page.on('pageerror', (error) => problems.push(`${page.url()}: ${error.message}`));
      page.on('console', (message) => message.type() === 'error' && problems.push(`${page.url()}: ${message.text()}`));
    };
    const page = await context.newPage();
    watch(page);

    // Arabic paints in Noto Kufi, never in the fallback's Arial; Latin in Schibsted Grotesk.
    const fontsOf = async (route: string, selector: string) => {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const cdp = await context.newCDPSession(page);
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      return fonts.map((font) => font.familyName);
    };
    const arabic = await fontsOf('/ar/login', 'h1');
    check(arabic.includes('Noto Kufi Arabic') && !arabic.includes('Arial'), 'Arabic text paints in Noto Kufi Arabic');
    check((await fontsOf('/en/login', 'h1')).includes('Schibsted Grotesk'), 'Latin text paints in Schibsted Grotesk');

    // A stored light theme never paints dark first, and the motion setting is there before the page is parsed.
    const themed = await browser.newContext();
    await themed.addInitScript(() => {
      localStorage.setItem('rsk-theme', '"light"');
      const seen = ((window as unknown as { __classes: string[] }).__classes = [] as string[]);
      new MutationObserver(() => seen.push(document.documentElement.className)).observe(document, { attributes: true, subtree: true });
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { __motion: string | undefined }).__motion = document.documentElement.dataset.motion;
      });
    });
    const themedPage = await themed.newPage();
    await themedPage.goto(`${BASE}/ar/login`, { waitUntil: 'networkidle' });
    const { classes, motion } = await themedPage.evaluate(() => ({
      classes: (window as unknown as { __classes: string[] }).__classes,
      motion: (window as unknown as { __motion?: string }).__motion,
    }));
    check(
      !classes.some((value) => /\bdark\b/.test(value)) && classes.some((value) => /\blight\b/.test(value)),
      'a stored light theme never paints dark',
    );
    check(!!motion, 'the motion setting is set before the page is parsed');
    await themed.close();

    // Sign in lands where the visitor was going.
    await signIn(page, '/en/login?next=%2Fen%2Fsettings%3Ftab%3Da');
    await page.waitForURL(`${BASE}/en/settings?tab=a`);
    check(true, 'signing in lands on ?next= (/en/settings?tab=a)');

    // The language switch keeps the page and query, flips the direction, and is remembered.
    await page.getByRole('button', { name: /^AR,/ }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(`${BASE}/ar/settings?tab=a`);
    const arNav = JSON.parse(readFileSync(path.join(app, 'src/locales/ar/nav.json'), 'utf8')) as { settings: string };
    const switched = await page.evaluate(() => ({
      dir: document.documentElement.dir,
      lang: document.documentElement.lang,
      h1: document.querySelector('h1')?.textContent,
    }));
    check(
      switched.dir === 'rtl' && switched.lang === 'ar' && switched.h1 === arNav.settings,
      'switching to Arabic keeps the page and reads right to left',
    );
    check(
      (await context.cookies()).some((cookie) => cookie.name === 'rsk-lang' && cookie.value === 'ar'),
      '…and is remembered',
    );
    await page.goto(BASE);
    await page.waitForURL(`${BASE}/ar/dashboard`);
    check(true, 'the next visit to / opens in Arabic');

    // Sign out ends the session at the server.
    const arHeader = JSON.parse(readFileSync(path.join(app, 'src/locales/ar/header.json'), 'utf8')) as {
      openUserMenu: string;
      logout: string;
    };
    await page.getByRole('button', { name: arHeader.openUserMenu }).click();
    await page.getByRole('menuitem', { name: arHeader.logout }).click();
    await page.waitForURL(/\/ar\/login/);
    await page.goto(`${BASE}/ar/dashboard`);
    await page.waitForURL(/\/ar\/login\?next=/);
    check(true, 'signing out ends the session (the dashboard sends to sign in again)');

    // A crafted ?next= can't send the visitor to another site.
    const fresh = await browser.newContext();
    const freshPage = await fresh.newPage();
    watch(freshPage);
    await signIn(freshPage, '/en/login?next=%2Fen%2F..%2F%2Fevil.example');
    await freshPage.waitForURL(`${BASE}/en/dashboard`);
    check(new URL(freshPage.url()).origin === BASE, 'a crafted ?next= stays on the app');
    await fresh.close();

    check(problems.length === 0, `no page error or console error${problems.length ? `:\n${problems.join('\n')}` : ''}`);
  } finally {
    await browser.close();
  }
}

export async function verifyNext() {
  const app = buildStarter(mkdtempSync(path.join(os.tmpdir(), 'rsk-next-starter-')), 'next');
  let stop: (() => void) | undefined;
  try {
    const leftovers = walk(path.join(app, 'src')).flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return LEFTOVER_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => `${path.relative(app, file)}: ${pattern}`);
    });
    if (leftovers.length) throw new Error(`Showcase leftovers in the Next starter:\n${leftovers.join('\n')}`);

    refreshLockfile(app);
    run(app, installArgs());
    run(app, ['exec', 'next', 'typegen']);
    run(app, ['exec', 'tsc', '-b']);
    run(app, ['exec', 'vp', 'check']);
    run(app, ['exec', 'vp', 'test', '--run']);

    // Built without its secret (a first deploy), with a sentinel API_URL that must never reach the browser's files.
    const tsconfig = readFileSync(path.join(app, 'tsconfig.app.json'), 'utf8');
    run(app, ['exec', 'next', 'build'], { SESSION_SECRET: '', API_URL: `https://${SENTINEL}.invalid` });
    check(readFileSync(path.join(app, 'tsconfig.app.json'), 'utf8') === tsconfig, 'next build leaves tsconfig.app.json as it is');
    const leaked = walk(path.join(app, '.next/static')).filter((file) => readFileSync(file, 'latin1').includes(SENTINEL));
    check(leaked.length === 0, `no server setting in the browser's files${leaked.length ? `: ${leaked.join(', ')}` : ''}`);

    // One updater for both starters: a no-op kit:update leaves the app type-checking.
    run(app, ['exec', 'tsx', 'scripts/kit/kit.ts', 'update', '--from', app]);
    run(app, ['exec', 'tsc', '-b']);

    // Unconfigured, sign-in fails closed (no cookie), and the pages still answer.
    stop = await serve(app, { SESSION_SECRET: '' });
    const unconfigured = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE },
      body: JSON.stringify({ email: 'demo@example.com', password: 'demo-password' }),
    });
    check(unconfigured.status === 500 && !unconfigured.headers.get('set-cookie'), 'without SESSION_SECRET, sign-in fails closed');
    stop();

    stop = await serve(app, { SESSION_SECRET: randomBytes(32).toString('hex'), AUTH_MOCK: 'true' });
    await checkPages(app);

    const budget = (...args: string[]) =>
      run(app, ['exec', 'node', 'scripts/bundle/first-load.mjs', '--url', BASE, '--lang-in', 'path', '--budget', 'next-starter', ...args]);
    budget('--routes', '/login,/forgot-password', '--report', 'first-load-next-signed-out.json');
    budget('--session', '--seed', 'api', '--routes', '/dashboard,/settings', '--report', 'first-load-next-signed-in.json');

    run(app, [
      'exec',
      'node',
      'scripts/a11y/audit.mjs',
      '--base',
      BASE,
      '--seed',
      'api',
      '--lang-in',
      'path',
      '--signed-out',
      '/login,/forgot-password',
    ]);
    await checkInBrowser(app);
    console.log(`\nNext starter verified: ${app}`);
  } finally {
    stop?.();
    if (!process.env.KEEP_STARTER) rmSync(app, { recursive: true, force: true });
  }
}
