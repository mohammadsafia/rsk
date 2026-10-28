// tests/docs/in-next.test.ts — a component that links or navigates through the router adapter behaves a little
// differently in a Next app (next/link, the language in the URL), so its docs page says how, under "In Next".
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ROUTER = /\b(KitLink|useKitNavigate|useKitPathname|useKitRouter|useKitSearchParams)\b/;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Docs pages by their frontmatter id. */
const docs = new Map(
  walk(path.join(ROOT, 'src/component-docs'))
    .filter((file) => file.endsWith('.mdx'))
    .map(
      (file) =>
        [
          readFileSync(file, 'utf8')
            .match(/^id: (.+)$/m)?.[1]
            .trim(),
          file,
        ] as const,
    )
    .filter((entry): entry is readonly [string, string] => !!entry[0]),
);

/** The folders (component ids) whose source uses the router adapter, plus AppShell, which renders the Sidebar. */
const routerAware = [
  ...new Set(
    ['src/components', 'src/blocks']
      .flatMap((dir) => walk(path.join(ROOT, dir)))
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx') && ROUTER.test(readFileSync(file, 'utf8')))
      .map((file) => path.basename(path.dirname(file))),
  ),
  'app-shell',
].sort();

describe('In Next notes', () => {
  it('every router-aware component with a docs page has an "In Next" section', () => {
    const missing = routerAware.filter((id) => docs.has(id) && !/^## In Next$/m.test(readFileSync(docs.get(id) as string, 'utf8')));
    expect(missing).toEqual([]);
  });

  it('the router-aware components without a docs page are known', () => {
    expect(routerAware.filter((id) => !docs.has(id))).toEqual(['command-palette']);
  });
});
