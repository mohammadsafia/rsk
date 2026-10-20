import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { blockFiles, generateBlockIndex, readBlocks, resolveDependencies, validateBlocks, type BlockMeta } from '../../scripts/kit/blocks';

const put = (root: string, file: string, text: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
};
const meta = (id: string, extra: Partial<BlockMeta> = {}): BlockMeta => ({
  id,
  title: id,
  level: 'organism',
  family: 'test',
  description: `${id} block`,
  tags: [],
  dependsOn: [],
  packages: {},
  routes: [],
  nav: [],
  ...extra,
});
/** A kit-shaped folder with the given blocks (index.ts exporting each route component, both locales). */
const kit = (blocks: BlockMeta[]) => {
  const root = mkdtempSync(path.join(tmpdir(), 'blocks-'));
  for (const block of blocks) {
    put(root, `src/blocks/${block.id}/block.json`, JSON.stringify(block));
    put(
      root,
      `src/blocks/${block.id}/index.ts`,
      block.routes.map((route) => `export const ${route.component} = () => null;`).join('\n') || 'export {};',
    );
    for (const lang of ['en', 'ar']) put(root, `src/locales/${lang}/block-${block.id}.json`, '{}');
  }
  return root;
};

describe('blocks', () => {
  it('reads every block.json, sorted, and lists a block’s files (its folder and both locale files)', () => {
    const root = kit([meta('b'), meta('a')]);
    expect(readBlocks(root).map((block) => block.id)).toEqual(['a', 'b']);
    expect(blockFiles(root, 'a')).toEqual([
      'src/blocks/a/block.json',
      'src/blocks/a/index.ts',
      'src/locales/ar/block-a.json',
      'src/locales/en/block-a.json',
    ]);
  });

  it('accepts a valid catalogue', () => {
    expect(validateBlocks(kit([meta('a'), meta('b', { dependsOn: ['a'] })]))).toEqual([]);
  });

  it('reports a missing locale, an unknown dependency, a bad level, a route to a component the block doesn’t export, and an id that isn’t its folder', () => {
    const root = kit([meta('a', { dependsOn: ['ghost'], routes: [{ path: '/x', component: 'Missing', layout: 'app' }] })]);
    put(root, 'src/blocks/a/index.ts', 'export {};');
    put(root, 'src/blocks/c/block.json', JSON.stringify({ ...meta('not-c'), level: 'atom' }));
    const errors = validateBlocks(root).join('\n');
    expect(errors).toMatch(/a: depends on unknown block "ghost"/);
    expect(errors).toMatch(/a: route \/x names "Missing", which src\/blocks\/a\/index\.ts doesn't export/);
    expect(errors).toMatch(/c: id "not-c" must match its folder/);
    expect(errors).toMatch(/c: level must be molecule, organism or template/);
    expect(errors).toMatch(/c: missing src\/locales\/en\/block-c\.json/);
  });

  it('resolves dependencies first, without duplicates, and refuses cycles and unknown ids', () => {
    const catalogue = [meta('a'), meta('b', { dependsOn: ['a'] }), meta('c', { dependsOn: ['b', 'a'] })];
    expect(resolveDependencies(['c', 'a'], catalogue)).toEqual(['a', 'b', 'c']);
    expect(() => resolveDependencies(['x'], catalogue)).toThrow(/Unknown block "x"/);
    const cyclic = [meta('a', { dependsOn: ['b'] }), meta('b', { dependsOn: ['a'] })];
    expect(() => resolveDependencies(['a'], cyclic)).toThrow(/cycle: a → b → a/);
  });
});

describe('generated block index', () => {
  it('with no blocks, exports empty routes and nav and no error element', () => {
    const source = generateBlockIndex([]);
    expect(source).toContain('export const appBlockRoutes: RouteObject[] = [];');
    expect(source).toContain('export const bareBlockRoutes: RouteObject[] = [];');
    expect(source).toContain('export const BlockErrorElement: ComponentType | null = null;');
    expect(source).toContain('export const blockNav: AppMenu[] = [];');
  });

  it('lazy-loads each route from its block, puts a catch-all last, and wires nav and the error element', () => {
    const source = generateBlockIndex([
      meta('system-pages', {
        level: 'template',
        routes: [
          { path: '*', component: 'NotFoundPage', layout: 'bare' },
          { path: '/maintenance', component: 'MaintenancePage', layout: 'bare' },
          { path: '/no-access', component: 'NoAccessPage', layout: 'app' },
        ],
        errorElement: 'ServerErrorPage',
        nav: [{ id: 'status', path: '/status', icon: 'Activity' }],
      }),
    ]);
    expect(source).toContain(`{ path: '/no-access', lazy: async () => ({ Component: (await import('./system-pages')).NoAccessPage }) }`);
    expect(source.indexOf("path: '/maintenance'")).toBeLessThan(source.indexOf("path: '*'"));
    expect(source).toContain("export { ServerErrorPage as BlockErrorElement } from './system-pages';");
    expect(source).toMatch(/import \{ Activity \} from 'lucide-react';/);
    expect(source).toContain("{ id: 'status', path: '/status', icon: Activity, labelKey: 'block-system-pages:nav.status' }");
  });
});
