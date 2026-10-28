/**
 * Proves the starter stands on its own: builds it into a temporary folder, installs (offline from the pnpm store locally, online in CI),
 * then runs its type check, lint/format check, tests and production build, checks each route's first-load budget, and
 * looks for showcase leftovers; then proves an app from the published starter updates onto it (verify-upgrade.ts).
 *
 *   pnpm starter:verify                    # the Vite starter
 *   pnpm starter:verify -- --target next   # the Next starter (verify-next.ts)
 */
import { execFileSync } from 'node:child_process';
import type { AddressInfo, Server } from 'node:net';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { chromium } from 'playwright';

import { serve } from '../bundle/first-load.mjs';
import { hashFile } from '../kit/core';
import { buildStarter, refreshLockfile } from './build-starter';
import { installArgs } from './install';
import { LEFTOVER_PATTERNS } from './manifest';
import { smokeSignInOut } from './smoke';
import { verifyNext } from './verify-next';
import { verifyUpgrade } from './verify-upgrade';

const run = (cwd: string, command: string, args: string[]) => {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, CI: '1' } });
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Every source file of the app (not dependencies, builds or reports) as path → sha256. */
const fingerprint = (root: string) =>
  new Map(
    walk(root)
      .map((file) => path.relative(root, file).split(path.sep).join('/'))
      .filter((file) => !/^(node_modules|dist)\/|\.tsbuildinfo$|^first-load-[\w-]+\.json$/.test(file))
      .map((file) => [file, hashFile(path.join(root, file))]),
  );

/** The built app in a browser: sign in, the dashboard, sign out; no page or console error on the way. */
async function smokeVite(out: string) {
  const header = JSON.parse(readFileSync(path.join(out, 'src/locales/en/header.json'), 'utf8')) as { openUserMenu: string; logout: string };
  const server = (await serve(path.join(out, 'dist'))) as Server;
  const browser = await chromium.launch();
  const problems: string[] = [];
  try {
    const page = await (await browser.newContext()).newPage();
    page.on('pageerror', (error) => problems.push(`${page.url()}: ${error.message}`));
    page.on('console', (message) => message.type() === 'error' && problems.push(`${page.url()}: ${message.text()}`));
    await smokeSignInOut(page, {
      base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      login: '/auth/login',
      home: '/dashboard',
      menuLabel: header.openUserMenu,
      signOutLabel: header.logout,
    });
    if (problems.length) throw new Error(`Page or console errors:\n${problems.join('\n')}`);
    console.log('  ✓ sign in → dashboard → sign out');
  } finally {
    await browser.close();
    server.close();
  }
}

async function verifyVite() {
  const out = buildStarter(mkdtempSync(path.join(os.tmpdir(), 'rsk-starter-')));
  const pnpm = ['pnpm@10.34.7'];

  try {
    const leftovers = walk(path.join(out, 'src')).flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      return LEFTOVER_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => `${path.relative(out, file)}: ${pattern}`);
    });
    if (leftovers.length) throw new Error(`Showcase leftovers in the starter:\n${leftovers.join('\n')}`);

    refreshLockfile(out);
    run(out, 'corepack', [...pnpm, ...installArgs()]);
    run(out, 'corepack', [...pnpm, 'exec', 'tsc', '-b']);
    run(out, 'corepack', [...pnpm, 'exec', 'vp', 'check']);
    run(out, 'corepack', [...pnpm, 'exec', 'vp', 'test', '--run']);
    run(out, 'corepack', [...pnpm, 'exec', 'vp', 'build']);
    await smokeVite(out);
    // First-load budget: each route's gzipped JS, page errors and untranslated keys (a dropped side-effect module).
    // The app's pages signed in as the demo user, and the sign-in pages as a signed-out visitor sees them.
    const budget = (...args: string[]) =>
      run(out, 'node', ['scripts/bundle/first-load.mjs', '--dist', 'dist', '--budget', 'starter', ...args]);
    budget('--session', '--routes', '/,/dashboard,/settings', '--redirects', '/=/dashboard', '--report', 'first-load-signed-in.json');
    budget('--routes', '/auth/login,/auth/forgot-password', '--report', 'first-load-signed-out.json');

    // Round trip: add every block in the catalogue, check the app the same way (a block may never break an app or its
    // first load), then remove them all and expect the starter back byte for byte.
    const before = fingerprint(out);
    const ids = (JSON.parse(readFileSync(path.join(out, 'registry/index.json'), 'utf8')) as { id: string }[]).map((block) => block.id);
    run(out, 'corepack', [...pnpm, 'exec', 'tsx', 'scripts/kit/add.ts', 'add', ...ids, '--from', '.']);
    run(out, 'corepack', [...pnpm, 'exec', 'tsc', '-b']);
    run(out, 'corepack', [...pnpm, 'exec', 'vp', 'check']);
    run(out, 'corepack', [...pnpm, 'exec', 'vp', 'test', '--run']);
    run(out, 'corepack', [...pnpm, 'exec', 'vp', 'build']);
    // The blocks' own routes too: the in-shell no-access page, and the bare maintenance and not-found pages.
    budget(
      '--session',
      '--routes',
      '/,/dashboard,/settings,/no-access',
      '--redirects',
      '/=/dashboard',
      '--report',
      'first-load-blocks-signed-in.json',
    );
    budget('--routes', '/auth/login,/auth/forgot-password,/maintenance,/no-such-page', '--report', 'first-load-blocks-signed-out.json');
    run(out, 'corepack', [...pnpm, 'exec', 'tsx', 'scripts/kit/add.ts', 'remove', ...ids, '--from', '.']);
    const after = fingerprint(out);
    const changed = [...new Set([...before.keys(), ...after.keys()])]
      .filter((file) => before.get(file) !== after.get(file))
      .sort((a, b) => a.localeCompare(b));
    if (changed.length)
      throw new Error(`kit:add then kit:remove left the starter different:\n${changed.map((file) => `  ${file}`).join('\n')}`);
    // An app made from the published starter updates onto this one: old updater first, then the new one.
    verifyUpgrade(out);
    console.log(`\nStarter verified: ${out}`);
  } finally {
    if (!process.env.KEEP_STARTER) rmSync(out, { recursive: true, force: true });
  }
}

// --target next verifies the Next starter (verify-next.ts); the default is the Vite one.
const targetAt = process.argv.indexOf('--target');
const target = targetAt === -1 ? 'vite' : process.argv[targetAt + 1];
if (target === 'next') await verifyNext();
else if (target === 'vite') await verifyVite();
else throw new Error(`--target must be vite or next, not "${target}"`);
