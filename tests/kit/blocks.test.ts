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

  it('requires a label in both languages for each menu entry', () => {
    const root = kit([meta('a', { nav: [{ id: 'home', path: '/a', icon: 'House' }] })]);
    expect(validateBlocks(root).join('\n')).toMatch(/a: menu entry "home" has no nav\.home in src\/locales\/en\/block-a\.json/);
    for (const lang of ['en', 'ar']) put(root, `src/locales/${lang}/block-a.json`, JSON.stringify({ nav: { home: 'Home' } }));
    expect(validateBlocks(root)).toEqual([]);
  });

  it('reports a dependency cycle, a route layout that isn’t app or bare, and two blocks claiming * or the error page', () => {
    const root = kit([
      meta('a', { dependsOn: ['b'], routes: [{ path: '*', component: 'APage', layout: 'bare' }], errorElement: 'APage' }),
      meta('b', { dependsOn: ['a'], routes: [{ path: '*', component: 'BPage', layout: 'bare' }], errorElement: 'BPage' }),
      meta('c', { routes: [{ path: '/c', component: 'CPage', layout: 'side' as 'app' }] }),
    ]);
    const errors = validateBlocks(root).join('\n');
    expect(errors).toMatch(/depend on each other in a cycle: a → b → a/);
    expect(errors).toMatch(/c: route \/c has layout "side"; use "app" or "bare"/);
    expect(errors).toMatch(/more than one block routes "\*": a, b/);
    expect(errors).toMatch(/more than one block has an errorElement: a, b/);
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
    expect(source).toContain('export const BlockErrorElement: (() => ReactElement) | null = null;');
    expect(source).not.toContain('useRouteError');
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
    // The router's error hooks feed the block's error page, which loads only when a route fails.
    expect(source).toContain("import { isRouteErrorResponse, useRevalidator, useRouteError } from 'react-router';");
    expect(source).toContain("const ErrorPage = lazy(async () => ({ default: (await import('./system-pages')).ServerErrorPage }));");
    expect(source).toMatch(/export function BlockErrorElement\(\): ReactElement \{/);
    expect(source).not.toMatch(/^export \{.*\} from/m);
    expect(source).toMatch(/import \{ Activity \} from 'lucide-react';/);
    expect(source).toContain("{ id: 'status', path: '/status', icon: Activity, labelKey: 'block-system-pages:nav.status' }");
    // The menu shows on every page, before the block loads: its labels come with the index (only the nav keys).
    expect(source).toContain("import { nav as blockSystemPagesNavEn } from '@locales/en/block-system-pages.json';");
    expect(source).toContain("i18n.addResourceBundle('ar', 'block-system-pages', { nav: blockSystemPagesNavAr }, true);");
  });

  it('writes a single short entry on one line and longer lists one entry per line, as the formatter does', () => {
    const one = generateBlockIndex([meta('m', { nav: [{ id: 'find', path: '/find', icon: 'Search' }] })]);
    expect(one).toContain(
      "export const blockNav: AppMenu[] = [{ id: 'find', path: '/find', icon: Search, labelKey: 'block-m:nav.find' }];",
    );
    const two = generateBlockIndex([
      meta('m', {
        nav: [
          { id: 'a', path: '/a', icon: 'Search' },
          { id: 'b', path: '/b', icon: 'Search' },
        ],
      }),
    ]);
    expect(two).toContain("export const blockNav: AppMenu[] = [\n  { id: 'a',");
  });

  it('registers no labels when no block has menu entries', () => {
    const source = generateBlockIndex([meta('quiet')]);
    expect(source).not.toContain('i18next');
    expect(source).not.toContain('addResourceBundle');
  });
});
