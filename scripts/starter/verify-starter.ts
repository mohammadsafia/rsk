/**
 * Proves the starter stands on its own: builds it into a temporary folder, installs (offline from the pnpm store locally, online in CI),
 * then runs its type check, lint/format check, tests and production build, checks each route's first-load budget, and
 * looks for showcase leftovers.
 *
 *   pnpm starter:verify
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildStarter, refreshLockfile } from './build-starter';
import { installArgs } from './install';
import { LEFTOVER_PATTERNS } from './manifest';

const run = (cwd: string, command: string, args: string[]) => {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd, stdio: 'inherit', env: { ...process.env, CI: '1' } });
};

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

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
  // First-load budget: each route's gzipped JS, page errors and untranslated keys (a dropped side-effect module).
  // The app's pages signed in as the demo user, and the sign-in pages as a signed-out visitor sees them.
  const budget = (...args: string[]) =>
    run(out, 'node', ['scripts/bundle/first-load.mjs', '--dist', 'dist', '--budget', 'starter', ...args]);
  budget('--session', '--routes', '/,/dashboard,/settings', '--redirects', '/=/dashboard', '--report', 'first-load-signed-in.json');
  budget('--routes', '/auth/login,/auth/forgot-password', '--report', 'first-load-signed-out.json');
  console.log(`\nStarter verified: ${out}`);
} finally {
  if (!process.env.KEEP_STARTER) rmSync(out, { recursive: true, force: true });
}
