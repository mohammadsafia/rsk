import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { needsSelfUpdate, updateGaps } from '../../scripts/kit/gaps';

/** A Vite app from before the router adapter: its bootstrap renders React Router straight away. */
const viteApp = (bootstrap = 'root.render(<RouterProvider router={ROUTER} />);'): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kit-gaps-'));
  mkdirSync(path.join(dir, 'src/routes'), { recursive: true });
  writeFileSync(path.join(dir, 'kit.lock.json'), JSON.stringify({ kit: 'aaaaaaa', files: {} }));
  writeFileSync(path.join(dir, 'src/bootstrap.tsx'), bootstrap);
  // Wired for blocks already, so only the adapter is missing.
  writeFileSync(path.join(dir, 'src/routes/router.tsx'), 'appBlockRoutes bareBlockRoutes BlockErrorElement');
  writeFileSync(path.join(dir, 'src/routes/routes.ts'), 'blockNav');
  writeFileSync(path.join(dir, 'tsconfig.app.json'), '"@blocks/*" "@locales/*"');
  mkdirSync(path.join(dir, 'src/locales'));
  writeFileSync(path.join(dir, 'src/locales/index.ts'), "'!./{en,ar}/block-*.json'");
  return dir;
};

describe('kit:update wiring gaps', () => {
  it('reports a Vite app without the KitRouterProvider, and nothing once it has one', () => {
    expect(updateGaps(viteApp()).join('\n')).toMatch(/KitRouterProvider/);
    expect(updateGaps(viteApp('<ReactRouterKitProvider><RouterProvider router={ROUTER} /></ReactRouterKitProvider>'))).toEqual([]);
  });

  it('still reports it when the adapter file was copied but nothing renders it', () => {
    const dir = viteApp();
    writeFileSync(
      path.join(dir, 'src/routes/routerAdapter.tsx'),
      'export const ReactRouterKitProvider = ({ children }) => <KitRouterProvider router={adapter}>{children}</KitRouterProvider>;',
    );
    expect(updateGaps(dir).join('\n')).toMatch(/KitRouterProvider/);
  });

  it('names the adapter file to copy from the starter it updated from', () => {
    const starter = viteApp();
    writeFileSync(path.join(starter, 'src/routes/routerAdapter.tsx'), 'export const reactRouterKitAdapter = {};');
    expect(updateGaps(viteApp(), starter).join('\n')).toContain('export const reactRouterKitAdapter = {};');
  });

  it('asks for a self-update only when the kit updater itself changed', () => {
    expect(needsSelfUpdate([{ path: 'scripts/kit/kit.ts', status: 'updated' }])).toBe(true);
    expect(needsSelfUpdate([{ path: 'scripts/kit/gaps.ts', status: 'added' }])).toBe(true);
    expect(needsSelfUpdate([{ path: 'scripts/kit/kit.ts', status: 'modified' }])).toBe(false);
    expect(needsSelfUpdate([{ path: 'src/components/ui/button/Button.tsx', status: 'updated' }])).toBe(false);
  });
});
