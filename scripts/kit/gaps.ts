/**
 * What an app must wire by hand after kit:update: the kit can't edit the app's own files (its bootstrap, router,
 * tsconfig), so kit:update lists what they still lack under "To finish this update".
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { kitTarget } from '../lib/kit-target.mjs';
import { wiringGaps } from './add';
import type { Row } from './core';

const ADAPTER = 'src/routes/routerAdapter.tsx';
/** The provider rendered as an element (not just named or defined). */
const PROVIDER = /<(KitRouterProvider|ReactRouterKitProvider)\b/;

const sources = (dir: string): string[] =>
  !existsSync(dir)
    ? []
    : readdirSync(dir).flatMap((name) => {
        const full = path.join(dir, name);
        // Tests and their helpers wrap their own trees: only the app's code counts.
        return statSync(full).isDirectory() ? sources(full) : /\.tsx?$/.test(name) && !/\.test\.|test-utils/.test(full) ? [full] : [];
      });

/** Whether the app's own sources render the kit's router provider: not the kit's contexts, nor the adapter that defines it. */
const rendersProvider = (appDir: string): boolean =>
  sources(path.join(appDir, 'src'))
    .filter((file) => !file.includes(`${path.sep}lib${path.sep}contexts${path.sep}`) && file !== path.join(appDir, ADAPTER))
    .some((file) => PROVIDER.test(readFileSync(file, 'utf8')));

/**
 * The wiring a Vite app still lacks: the kit's router adapter (without it kit links reload the page) and the block
 * wiring kit:add needs. `starterDir` is the starter kit:update read, whose adapter is printed to copy.
 */
export function updateGaps(appDir: string, starterDir?: string): string[] {
  return [...adapterGaps(appDir, starterDir), ...wiringGaps(appDir)];
}

/** The router adapter a Vite app still lacks: without it kit links reload the page. */
export function adapterGaps(appDir: string, starterDir?: string): string[] {
  if (kitTarget(appDir) === 'next') return [];
  const gaps: string[] = [];
  if (!rendersProvider(appDir)) {
    const adapter = starterDir && existsSync(path.join(starterDir, ADAPTER)) ? readFileSync(path.join(starterDir, ADAPTER), 'utf8') : '';
    gaps.push(
      [
        `${ADAPTER}: add the kit's router adapter (KitRouterProvider over React Router), then in src/bootstrap.tsx`,
        "  import { ReactRouterKitProvider } from './routes/routerAdapter' and wrap <RouterProvider> in it.",
        '  Until then kit links and the command palette load whole pages. Tests that render under a MemoryRouter or',
        '  createMemoryRouter need the same wrap, or kit components read the window location instead of the router’s.',
        ...(adapter
          ? [
              '  The starter’s file:',
              '',
              ...adapter
                .trimEnd()
                .split('\n')
                .map((line) => `    ${line}`),
              '',
            ]
          : []),
      ].join('\n'),
    );
  }
  return gaps;
}

/** True when kit:update brings a new version of the updater itself, which must run the rest of the update. */
export const needsSelfUpdate = (rows: Pick<Row, 'path' | 'status'>[]): boolean =>
  rows.some((row) => row.path.startsWith('scripts/kit/') && (row.status === 'updated' || row.status === 'added'));
