/**
 * Works on the kit inside a Next app: builds the Next starter into a scratch folder (once), runs `next dev` there, and
 * copies each file saved in this repository into it, so the kit, the shared screens and the Next overlay hot-reload
 * as they would in an app.
 *
 *   pnpm starter:dev -- --target next             # in $TMPDIR/rsk-next-dev
 *   pnpm starter:dev -- --target next --fresh     # build it again first
 *   pnpm starter:dev -- --target next --dir ../x  # somewhere else
 *   pnpm starter:dev -- --target next --port 3100
 */
import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, watch } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildStarter, refreshLockfile } from './build-starter';
import { installArgs } from './install';
import { DROP, NEXT_DROP } from './manifest';
import { writeStaticLocales } from './next';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OVERLAYS = ['scripts/starter/overlay/next/', 'scripts/starter/overlay/common/'];
/** Files the starter build writes for a Next app; the repo's own versions are the Vite app's. */
const GENERATED = ['src/locales/index.ts', 'src/blocks/index.ts'];

const toScreens = (rel: string) => rel.replace(/^src\/pages\//, 'src/screens/');
const fromScreens = (rel: string) => rel.replace(/^src\/screens\//, 'src/pages/');
const dropped = (rel: string) => [...DROP, ...NEXT_DROP].some((prefix) => rel === prefix || rel.startsWith(prefix));
const overlaid = (target: string) => OVERLAYS.some((overlay) => existsSync(path.join(ROOT, overlay, fromScreens(target))));

/**
 * Where a file changed in this repository goes in the dev Next app, or null when the app doesn't have it: an overlay's
 * file at the app's root (its src/pages in src/screens), a file under src/ the starter ships where it is, unless an
 * overlay replaces it or the build generates it.
 */
export function devTarget(rel: string): string | null {
  const overlay = OVERLAYS.find((prefix) => rel.startsWith(prefix));
  if (overlay) return toScreens(rel.slice(overlay.length));
  if (!rel.startsWith('src/') || dropped(rel) || GENERATED.includes(rel)) return null;
  const target = toScreens(rel);
  return overlaid(target) ? null : target;
}

const IGNORED = /^(\.git|node_modules|\.next|dist|\.starter|\.superpowers)(\/|$)/;
/** Editors' and tools' temporary files (sed's .!123!x, emacs' .#x, vim's x.swp, x~): never copied. */
export const isTemporary = (rel: string): boolean => /(^|\/)(\.[!#][^/]*|[^/]*(~|\.swp|\.tmp))$/.test(rel);

/** Copies (or deletes) one changed file into the app; a locale change rewrites the app's static locale index. */
function sync(dir: string, rel: string) {
  const target = devTarget(rel);
  if (!target) return;
  const source = path.join(ROOT, rel);
  if (existsSync(source)) {
    mkdirSync(path.dirname(path.join(dir, target)), { recursive: true });
    copyFileSync(source, path.join(dir, target));
  } else rmSync(path.join(dir, target), { force: true });
  if (target.startsWith('src/locales/')) writeStaticLocales(dir);
  console.log(`↻ ${target}`);
}

export function startDev({ dir, fresh, port }: { dir: string; fresh: boolean; port: number }): void {
  if (fresh) rmSync(dir, { recursive: true, force: true });
  if (!existsSync(path.join(dir, 'package.json'))) {
    console.log(`Building the Next starter into ${dir}…`);
    buildStarter(dir, 'next');
    refreshLockfile(dir);
    execFileSync('corepack', ['pnpm@10.34.7', ...installArgs()], { cwd: dir, stdio: 'inherit' });
  }
  if (!existsSync(path.join(dir, '.env.local'))) copyFileSync(path.join(dir, '.env.example'), path.join(dir, '.env.local'));

  // Its own process group, so stopping ends next dev's server too.
  const server = spawn('corepack', ['pnpm@10.34.7', 'exec', 'next', 'dev', '-p', String(port)], {
    cwd: dir,
    stdio: 'inherit',
    detached: true,
    // A dev-only secret: the demo account signs in without setting one up.
    env: { ...process.env, SESSION_SECRET: process.env.SESSION_SECRET ?? 'starter-dev-only-secret-'.repeat(2) },
  });
  const watcher = watch(ROOT, { recursive: true }, (_event, name) => {
    const rel = name?.split(path.sep).join('/');
    if (rel && !IGNORED.test(rel) && !isTemporary(rel)) sync(dir, rel);
  });
  const stop = () => {
    watcher.close();
    try {
      if (server.pid) process.kill(-server.pid);
    } catch {
      // Already gone.
    }
  };
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, stop);
  server.on('exit', (code) => {
    watcher.close();
    process.exit(code ?? 0);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const valueOf = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const target = valueOf('--target') ?? 'next';
  if (target === 'vite') throw new Error('The Vite starter is this repository: run pnpm dev.');
  if (target !== 'next') throw new Error(`--target must be next, not "${target}"`);
  startDev({
    dir: path.resolve(valueOf('--dir') ?? path.join(os.tmpdir(), 'rsk-next-dev')),
    fresh: args.includes('--fresh'),
    port: Number(valueOf('--port') ?? 3000),
  });
}
