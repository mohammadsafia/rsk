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
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync, watch } from 'node:fs';
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
/** Files the build rewrites for an app (fonts, docs styles, showcase menu labels): copying them would undo that. */
const REWRITTEN = ['src/index.css', 'src/locales/en/nav.json', 'src/locales/ar/nav.json'];
/** A block's own files (its folder, its copy): the starter keeps them in registry/blocks/<id>/files for kit:add. */
const BLOCK_FILE = /^src\/blocks\/([\w-]+)\/|^src\/locales\/(?:en|ar)\/block-([\w-]+)\.json$/;

const toScreens = (rel: string) => rel.replace(/^src\/pages\//, 'src/screens/');
const fromScreens = (rel: string) => rel.replace(/^src\/screens\//, 'src/pages/');
const dropped = (rel: string) => [...DROP, ...NEXT_DROP].some((prefix) => rel === prefix || rel.startsWith(prefix));
const overlaid = (target: string) => OVERLAYS.some((overlay) => existsSync(path.join(ROOT, overlay, fromScreens(target))));

/**
 * Where a file changed in this repository goes in the dev Next app, or null when the app doesn't have it: an overlay's
 * file at the app's root (its src/pages in src/screens), a block's file in the block catalogue, a file under src/ the
 * starter ships where it is, unless an overlay replaces it or the build generates or rewrites it.
 */
export function devTarget(rel: string): string | null {
  const overlay = OVERLAYS.find((prefix) => rel.startsWith(prefix));
  if (overlay) return toScreens(rel.slice(overlay.length));
  if (!rel.startsWith('src/') || dropped(rel) || GENERATED.includes(rel) || REWRITTEN.includes(rel)) return null;
  const block = BLOCK_FILE.exec(rel);
  if (block) {
    const id = block[1] ?? block[2];
    return rel === `src/blocks/${id}/block.json` ? `registry/blocks/${id}/block.json` : `registry/blocks/${id}/files/${rel}`;
  }
  const target = toScreens(rel);
  return overlaid(target) ? null : target;
}

const IGNORED = /^(\.git|node_modules|\.next|dist|\.starter|\.superpowers)(\/|$)/;
/** Editors' and tools' temporary files (sed's .!123!x, emacs' .#x, vim's x.swp, x~): never copied. */
export const isTemporary = (rel: string): boolean => /(^|\/)(\.[!#][^/]*|[^/]*(~|\.swp|\.tmp))$/.test(rel);

/**
 * Copies (or deletes) one changed path from `root` into the app at `dir`. A folder that appears is skipped (its files
 * arrive as their own changes); one that goes is deleted whole. A locale change rewrites the app's static locale index.
 */
export function syncChange(root: string, dir: string, rel: string): void {
  if (REWRITTEN.includes(rel)) console.log(`${rel} is rewritten by the build: pnpm starter:dev -- --fresh to pick it up`);
  const target = devTarget(rel);
  if (!target) return;
  const source = path.join(root, rel);
  if (existsSync(source)) {
    if (statSync(source).isDirectory()) return;
    mkdirSync(path.dirname(path.join(dir, target)), { recursive: true });
    copyFileSync(source, path.join(dir, target));
  } else rmSync(path.join(dir, target), { recursive: true, force: true });
  if (/^src\/locales\/(en|ar)\/[^/]+\.json$/.test(target)) writeStaticLocales(dir);
  if (target.startsWith('registry/')) console.log(`↻ ${target} (kit:add or kit:update the block to use it)`);
  else console.log(`↻ ${target}`);
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
    if (!rel || IGNORED.test(rel) || isTemporary(rel)) return;
    try {
      syncChange(ROOT, dir, rel);
    } catch (error) {
      console.warn(`starter:dev: couldn't copy ${rel}: ${(error as Error).message}`);
    }
  });
  const stop = () => {
    watcher.close();
    try {
      if (server.pid) process.kill(-server.pid);
    } catch {
      // Already gone.
    }
  };
  // However this process ends, next dev's server (its own process group) ends with it.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, stop);
  process.on('exit', stop);
  process.on('uncaughtException', (error) => {
    console.error(error);
    stop();
    process.exit(1);
  });
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
