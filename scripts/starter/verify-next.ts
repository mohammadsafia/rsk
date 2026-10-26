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
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { type Browser, chromium, type Page } from 'playwright';

import { hashFile } from '../kit/core';
import { buildStarter, refreshLockfile } from './build-starter';
import { installArgs } from './install';
import { LEFTOVER_PATTERNS } from './manifest';
import { smokeSignInOut } from './smoke';

const PORT = 5410;
const BASE = `http://127.0.0.1:${PORT}`;
const pnpm = ['pnpm@10.34.7'];
const SENTINEL = `rsk-sentinel-${randomBytes(6).toString('hex')}`;
/** The public site URL the app is built with: canonical, hreflang, sitemap and OG URLs are absolute on it. */
const SITE = 'https://rsk-verify.example';

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

/** Every file of the app but what building, testing and measuring it leave behind. */
const fingerprint = (root: string) =>
  new Map(
    walk(root)
      .map((file) => path.relative(root, file).split(path.sep).join('/'))
      .filter(
        (file) => !/^(node_modules|\.next)\/|^next-env\.d\.ts$|\.tsbuildinfo$|^first-load-[\w-]+\.json$|^a11y-report\.json$/.test(file),
      )
      .map((file) => [file, hashFile(path.join(root, file))]),
  );

/** A request as the browser sends it, the redirect not followed. */
const get = (route: string, headers: Record<string, string> = {}) => fetch(`${BASE}${route}`, { redirect: 'manual', headers });
const locationOf = (response: Response) => {
  const location = response.headers.get('location');
  return location ? new URL(location, BASE).pathname + new URL(location, BASE).search : null;
};

async function checkPages(app: string) {
  check(locationOf(await get('/', { 'Accept-Language': 'en;q=0.2, ar;q=0.9' })) === '/ar', '/ goes to /ar for an Arabic browser');
  const home = await get('/en');
  const enLanding = JSON.parse(readFileSync(path.join(app, 'src/locales/en/landing.json'), 'utf8')) as { hero: { title: string } };
  check(home.status === 200 && (await home.text()).includes(enLanding.hero.title), '/en is the public landing page, server-rendered');
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

/** The attributes of every `<tag …>` in `html`, lower-cased names. */
const tagsOf = (html: string, tag: string) =>
  [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'gi'))].map(([, attributes]) =>
    Object.fromEntries([...attributes.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [name.toLowerCase(), value])),
  );

/** A session cookie for the demo account, as the browser gets it from sign-in. */
async function demoCookie(): Promise<string> {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: 'demo@example.com', password: 'demo-password' }),
  });
  return (response.headers.get('set-cookie') ?? '').split(';')[0];
}

/** What a crawler and a link preview read: the Arabic home page's HTML, the sitemap, robots and the OG image. */
async function checkSeo(app: string) {
  const arLanding = JSON.parse(readFileSync(path.join(app, 'src/locales/ar/landing.json'), 'utf8')) as {
    hero: { title: string; description: string };
  };
  const html = await (await get('/ar')).text();
  check(html.includes('<html lang="ar" dir="rtl"'), '/ar is server-rendered right to left');
  check(html.includes(`<title>${arLanding.hero.title}</title>`), '…with its Arabic title');
  const meta = tagsOf(html, 'meta');
  const content = (key: string) => meta.find((tag) => tag.name === key || tag.property === key)?.content;
  check(content('description') === arLanding.hero.description, '…and its Arabic description');
  const links = tagsOf(html, 'link');
  check(
    links.some((tag) => tag.rel === 'canonical' && tag.href === `${SITE}/ar`),
    `…a canonical URL on the site (${SITE}/ar)`,
  );
  const alternates = Object.fromEntries(
    links.filter((tag) => tag.rel === 'alternate' && tag.hreflang).map((tag) => [tag.hreflang, tag.href]),
  );
  check(
    alternates.en === `${SITE}/en` && alternates.ar === `${SITE}/ar` && [SITE, `${SITE}/`].includes(alternates['x-default']),
    '…hreflang alternates for en, ar and x-default',
  );
  const image = content('og:image');
  const picture = image ? await fetch(`${BASE}${new URL(image).pathname}${new URL(image).search}`) : null;
  check(
    image?.startsWith(`${SITE}/ar/opengraph-image`) && picture?.status === 200 && picture.headers.get('content-type') === 'image/png',
    '…and an Open Graph image that answers as a PNG',
  );
  check(content('og:locale') === 'ar_AR' && content('twitter:card') === 'summary_large_image', '…with Open Graph and Twitter data');

  const sitemap = await (await get('/sitemap.xml')).text();
  check(sitemap.includes(`<loc>${SITE}/en</loc>`) && sitemap.includes(`<loc>${SITE}/ar</loc>`), '/sitemap.xml lists both languages');
  const robots = await (await get('/robots.txt')).text();
  check(robots.includes('Disallow: /api/') && robots.includes(`Sitemap: ${SITE}/sitemap.xml`), '/robots.txt keeps crawlers out of /api');

  const cookie = await demoCookie();
  const members = await get('/en/members', { cookie });
  check(
    members.status === 200 && /<meta name="robots" content="noindex, nofollow"/.test(await members.text()),
    'signed-in pages answer noindex',
  );
}

/** The share of pixels two PNG screenshots differ in (a channel off by more than 32), counted in the browser's canvas. */
async function pixelDifference(page: Page, one: Buffer, two: Buffer): Promise<number> {
  // Anonymous functions only: tsx names inner functions with a helper the page doesn't have.
  return page.evaluate(
    async (pngs) => {
      const [a, b] = await Promise.all(
        pngs.map(async (base64) => {
          const image = new Image();
          image.src = `data:image/png;base64,${base64}`;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d') as CanvasRenderingContext2D;
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, image.width, image.height);
        }),
      );
      if (a.width !== b.width || a.height !== b.height) return 1;
      let differ = 0;
      for (let at = 0; at < a.data.length; at += 4)
        if ([0, 1, 2].some((channel) => Math.abs(a.data[at + channel] - b.data[at + channel]) > 32)) differ += 1;
      return differ / (a.data.length / 4);
    },
    [one.toString('base64'), two.toString('base64')],
  );
}

/**
 * The server's HTML alone is the page: with JavaScript off, /ar/login is Arabic, right to left and readable, and it
 * looks the same as once the browser has hydrated it (nothing jumps, appears or changes theme).
 */
async function checkNoFlash(browser: Browser) {
  const options = { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce', colorScheme: 'light' } as const;
  const arAuth = (await (await get('/ar/login')).text()).match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1];

  const off = await browser.newContext({ ...options, javaScriptEnabled: false });
  const serverOnly = await off.newPage();
  await serverOnly.goto(`${BASE}/ar/login`, { waitUntil: 'networkidle' });
  const html = serverOnly.locator('html');
  check(
    (await html.getAttribute('lang')) === 'ar' &&
      (await html.getAttribute('dir')) === 'rtl' &&
      !!arAuth &&
      (await serverOnly.locator('h1').textContent()) === arAuth &&
      (await serverOnly.locator('h1').isVisible()),
    'with JavaScript off, /ar/login is Arabic, right to left, its heading showing',
  );
  const before = await serverOnly.screenshot();
  await off.close();

  const on = await browser.newContext(options);
  const hydrated = await on.newPage();
  await hydrated.goto(`${BASE}/ar/login`, { waitUntil: 'networkidle' });
  await hydrated.evaluate(() => document.fonts.ready);
  const after = await hydrated.screenshot();
  const differ = await pixelDifference(hydrated, before, after);
  check(differ <= 0.005, `…and looks the same once hydrated (${(differ * 100).toFixed(2)} % of pixels differ)`);
  await on.close();
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

    // A stored theme wins over the system's from the first paint (a dark choice on a light system is the flash people
    // see), and the motion setting is there before the page is parsed.
    for (const [stored, system] of [
      ['light', 'dark'],
      ['dark', 'light'],
    ] as const) {
      const themed = await browser.newContext({ colorScheme: system });
      await themed.addInitScript((theme) => {
        localStorage.setItem('rsk-theme', JSON.stringify(theme));
        const seen = ((window as unknown as { __classes: string[] }).__classes = [] as string[]);
        new MutationObserver(() => seen.push(document.documentElement.className)).observe(document, { attributes: true, subtree: true });
        document.addEventListener('DOMContentLoaded', () => {
          (window as unknown as { __motion: string | undefined }).__motion = document.documentElement.dataset.motion;
        });
      }, stored);
      const themedPage = await themed.newPage();
      await themedPage.goto(`${BASE}/ar/login`, { waitUntil: 'networkidle' });
      const { classes, motion } = await themedPage.evaluate(() => ({
        classes: (window as unknown as { __classes: string[] }).__classes,
        motion: (window as unknown as { __motion?: string }).__motion,
      }));
      const has = (value: string, theme: string) => new RegExp(`\\b${theme}\\b`).test(value);
      check(
        has(classes.find(Boolean) ?? '', stored) && !classes.some((value) => has(value, system)),
        `a stored ${stored} theme on a ${system} system never paints ${system}`,
      );
      check(!!motion, '…and the motion setting is set before the page is parsed');
      await themed.close();
    }

    await checkNoFlash(browser);

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
    await page.waitForURL(`${BASE}/ar`);
    check(true, 'the next visit to / opens in Arabic');
    await page.goto(`${BASE}/ar/dashboard`);

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

    await checkMembers(browser, watch);

    // The smoke test both starters run, in English and a fresh browser.
    const header = JSON.parse(readFileSync(path.join(app, 'src/locales/en/header.json'), 'utf8')) as {
      openUserMenu: string;
      logout: string;
    };
    const smoke = await browser.newContext();
    const smokePage = await smoke.newPage();
    watch(smokePage);
    await smokeSignInOut(smokePage, {
      base: BASE,
      login: '/en/login',
      home: '/en/dashboard',
      menuLabel: header.openUserMenu,
      signOutLabel: header.logout,
    });
    check(true, 'sign in → dashboard → sign out');
    await smoke.close();

    check(problems.length === 0, `no page error or console error${problems.length ? `:\n${problems.join('\n')}` : ''}`);
  } finally {
    await browser.close();
  }
}

/**
 * The three full-stack examples as a person meets them: the members table arrives with the page (no request from the
 * browser), an invite the API refuses shows its field error, and one it takes lands in the table.
 */
async function checkMembers(browser: Browser, watch: (page: Page) => void) {
  const cookie = await demoCookie();
  const second = (await (await get('/api/members?page=2&pageSize=10', { cookie })).json()) as { data: { name: string; email: string }[] };
  const html = await (await get('/en/members?page=2', { cookie })).text();
  check(html.includes(second.data[0].name), "/en/members?page=2 arrives with page 2's members in its HTML");

  const context = await browser.newContext();
  const page = await context.newPage();
  watch(page);
  const fetched: string[] = [];
  page.on('request', (request) => new URL(request.url()).pathname.startsWith('/api/members') && fetched.push(request.url()));
  await signIn(page, '/en/login?next=%2Fen%2Fmembers%3Fpage%3D2');
  await page.waitForURL(`${BASE}/en/members?page=2`);
  await page.getByRole('cell', { name: second.data[0].name, exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
  check(fetched.length === 0, `…and the browser shows them without fetching again${fetched.length ? `: ${fetched.join(', ')}` : ''}`);

  const sheet = page.getByRole('dialog');
  await page.getByRole('button', { name: 'Invite member' }).click();
  await sheet.getByLabel(/^Name/).fill('Taken Email');
  await sheet.getByLabel(/^Email/).fill(second.data[0].email);
  await sheet.getByRole('button', { name: 'Send invite' }).click();
  await sheet.getByText('That email is already a member.').waitFor();
  check(true, "an invite the API refuses shows the server's error under Email");

  const name = `Verify ${randomBytes(3).toString('hex')}`;
  await sheet.getByLabel(/^Name/).fill(name);
  await sheet.getByLabel(/^Email/).fill(`${name.replace(' ', '.').toLowerCase()}@example.com`);
  await sheet.getByRole('button', { name: 'Send invite' }).click();
  await sheet.waitFor({ state: 'detached' });
  await page.goto(`${BASE}/en/members?globalFilter=${encodeURIComponent(name)}`);
  await page.getByRole('cell', { name, exact: true }).waitFor();
  check(true, '…and one it takes, through the server action, lands in the table');
  await context.close();
}

/**
 * A test-only page that fails in the browser until the check sets window.verifyRecovered: the error page shows, then
 * "Try again" (Next's reset) renders the page again. (Failing only once wouldn't do: React retries a render that throws
 * while hydrating, and the retry would succeed before any error page.)
 */
const FAILING_PAGE = 'app/[lang]/verify-fails/page.tsx';
const FAILING_SOURCE = `'use client';

export default function Page() {
  if (typeof window !== 'undefined' && !(window as { verifyRecovered?: boolean }).verifyRecovered)
    throw new Error('verify-next: a page that fails');
  return <h1>recovered</h1>;
}
`;

type SystemCopy = Record<'notFound' | 'maintenance' | 'noAccess' | 'serverError', { title: string }> & { serverError: { retry: string } };

/**
 * Round trip: every block in the catalogue added, the app checked the same way (a block may never break an app or its
 * first load), their pages as a person meets them, then every block removed and the app back byte for byte.
 */
async function checkBlocks(app: string, budget: (...args: string[]) => void, audit: (...args: string[]) => void) {
  const before = fingerprint(app);
  const ids = (JSON.parse(readFileSync(path.join(app, 'registry/index.json'), 'utf8')) as { id: string }[]).map((block) => block.id);
  run(app, ['exec', 'tsx', 'scripts/kit/add.ts', 'add', ...ids, '--from', '.']);
  run(app, ['exec', 'next', 'typegen']);
  run(app, ['exec', 'tsc', '-b']);
  run(app, ['exec', 'vp', 'check']);
  run(app, ['exec', 'vp', 'test', '--run']);
  // After the app's tests: the test-only page is a client page, so it has no metadata (standards 13.4).
  mkdirSync(path.dirname(path.join(app, FAILING_PAGE)), { recursive: true });
  writeFileSync(path.join(app, FAILING_PAGE), FAILING_SOURCE);
  run(app, ['exec', 'next', 'build']);

  const copy = (lang: string) =>
    JSON.parse(readFileSync(path.join(app, `src/locales/${lang}/block-system-pages.json`), 'utf8')) as SystemCopy;
  const stop = await serve(app, { SESSION_SECRET: randomBytes(32).toString('hex'), AUTH_MOCK: 'true' });
  try {
    const maintenance = await get('/ar/maintenance');
    const html = await maintenance.text();
    check(
      maintenance.status === 200 && html.includes('<html lang="ar" dir="rtl"'),
      "a block's page outside the shell is public, right to left",
    );
    check(
      html.includes(`<title>${copy('ar').maintenance.title} · RSK</title>`) && html.includes(copy('ar').maintenance.title),
      '…with its Arabic title and heading in the server HTML',
    );

    const signedIn = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE },
      body: JSON.stringify({ email: 'demo@example.com', password: 'demo-password' }),
    });
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0];
    for (const lang of ['en', 'ar']) {
      const page = await get(`/${lang}/no-access`, { cookie });
      check(
        page.status === 200 && (await page.text()).includes(copy(lang).noAccess.title),
        `/${lang}/no-access shows the block's ${lang} heading`,
      );
    }
    check(locationOf(await get('/en/no-access')) === '/en/login?next=%2Fen%2Fno-access', '…and sends a signed-out visitor to sign in');
    const missing = await get('/en/no-such-page');
    check(
      missing.status === 404 && (await missing.text()).includes(copy('en').notFound.title),
      "an unknown URL is the block's 404, server-rendered",
    );

    const browser = await chromium.launch();
    try {
      const page = await (await browser.newContext()).newPage();
      await page.goto(`${BASE}/en/verify-fails`);
      await page.getByRole('heading', { name: copy('en').serverError.title }).waitFor();
      await page.evaluate(() => {
        (window as { verifyRecovered?: boolean }).verifyRecovered = true;
      });
      await page.getByRole('button', { name: copy('en').serverError.retry }).click();
      await page.getByRole('heading', { name: 'recovered' }).waitFor();
      check(true, "a page that fails shows the block's error page, and Try again recovers it");
    } finally {
      await browser.close();
    }

    budget('--routes', '/login,/forgot-password,/maintenance', '--report', 'first-load-next-blocks-signed-out.json');
    budget(
      '--session',
      '--seed',
      'api',
      '--routes',
      '/dashboard,/settings,/no-access',
      '--report',
      'first-load-next-blocks-signed-in.json',
    );
    audit('--signed-in', '/no-access', '--signed-out', '/login,/forgot-password,/maintenance');
  } finally {
    stop();
  }

  rmSync(path.join(app, path.dirname(FAILING_PAGE)), { recursive: true, force: true });
  run(app, ['exec', 'tsx', 'scripts/kit/add.ts', 'remove', ...ids, '--from', '.']);
  const after = fingerprint(app);
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter((file) => before.get(file) !== after.get(file)).sort();
  if (changed.length)
    throw new Error(`kit:add then kit:remove left the Next starter different:\n${changed.map((file) => `  ${file}`).join('\n')}`);
  check(true, 'adding then removing every block leaves the app as it was');
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
    run(app, ['exec', 'next', 'build'], { SESSION_SECRET: '', API_URL: `https://${SENTINEL}.invalid`, NEXT_PUBLIC_SITE_URL: SITE });
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
    await checkSeo(app);

    const budget = (...args: string[]) =>
      run(app, ['exec', 'node', 'scripts/bundle/first-load.mjs', '--url', BASE, '--lang-in', 'path', '--budget', 'next-starter', ...args]);
    budget('--routes', '/,/login,/forgot-password', '--report', 'first-load-next-signed-out.json');
    budget('--session', '--seed', 'api', '--routes', '/dashboard,/settings', '--report', 'first-load-next-signed-in.json');
    // The members example carries the kit data table, measured against its own budget.
    run(app, [
      'exec',
      'node',
      'scripts/bundle/first-load.mjs',
      '--url',
      BASE,
      '--lang-in',
      'path',
      '--budget',
      'next-table',
      '--session',
      '--seed',
      'api',
      '--routes',
      '/members',
      '--report',
      'first-load-next-table.json',
    ]);

    const audit = (...args: string[]) =>
      run(app, ['exec', 'node', 'scripts/a11y/audit.mjs', '--base', BASE, '--seed', 'api', '--lang-in', 'path', ...args]);
    audit('--signed-out', '/,/login,/forgot-password');
    await checkInBrowser(app);
    stop();
    stop = undefined;

    await checkBlocks(app, budget, audit);
    console.log(`\nNext starter verified: ${app}`);
  } finally {
    stop?.();
    if (!process.env.KEEP_STARTER) rmSync(app, { recursive: true, force: true });
  }
}
