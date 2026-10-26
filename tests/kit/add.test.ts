import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { addBlocks, rankBlocks, readCatalogue, removeBlocks, wiringGaps } from '../../scripts/kit/add';
import { readTree, writeLock } from '../../scripts/kit/core';

const dir = () => mkdtempSync(path.join(tmpdir(), 'kit-add-'));
const put = (root: string, file: string, text: string) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
};
const read = (root: string, file: string) => readFileSync(path.join(root, file), 'utf8');
const block = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: id,
  level: 'organism',
  family: 'test',
  description: id,
  tags: [],
  dependsOn: [],
  packages: {},
  routes: [],
  nav: [],
  ...extra,
});

const setup = () => {
  const starter = dir();
  const blocks = [
    block('a'),
    block('b', { dependsOn: ['a'], packages: { 'date-fns': '^4.1.0' }, routes: [{ path: '/b', component: 'BPage', layout: 'app' }] }),
    block('c', { routes: [{ path: '/c', component: 'CPage', layout: 'app' }] }),
  ];
  writeLock(starter, 'aaaaaaa', new Map(), []);
  put(starter, 'registry/index.json', JSON.stringify(blocks));
  for (const meta of blocks) {
    put(starter, `registry/blocks/${meta.id}/block.json`, JSON.stringify(meta));
    put(
      starter,
      `registry/blocks/${meta.id}/files/src/blocks/${meta.id}/index.ts`,
      meta.routes.length ? `export const ${meta.id.toUpperCase()}Page = () => null;\n` : 'export {};\n',
    );
    put(starter, `registry/blocks/${meta.id}/files/src/blocks/${meta.id}/block.json`, JSON.stringify(meta));
    for (const lang of ['en', 'ar']) put(starter, `registry/blocks/${meta.id}/files/src/locales/${lang}/block-${meta.id}.json`, '{}\n');
  }
  const app = dir();
  put(app, 'package.json', JSON.stringify({ dependencies: { react: '^19.3.0' } }));
  put(app, 'src/blocks/index.ts', '// generated\n');
  writeLock(app, 'aaaaaaa', readTree(app), []);
  return { starter, app, catalogue: readCatalogue(starter) };
};

describe('kit:add', () => {
  it('adds a block with its dependencies, both locales, the lock entry, the regenerated index and the install line', () => {
    const { app, catalogue } = setup();
    const result = addBlocks({ appDir: app, catalogue, ids: ['b'] });
    expect(result.added).toEqual(['a', 'b']);
    expect(existsSync(path.join(app, 'src/blocks/a/index.ts'))).toBe(true);
    expect(existsSync(path.join(app, 'src/locales/ar/block-b.json'))).toBe(true);
    const lock = JSON.parse(read(app, 'kit.lock.json'));
    expect(lock.blocks).toEqual(['a', 'b']);
    expect(Object.keys(lock.files)).toContain('src/blocks/b/index.ts');
    expect(read(app, 'src/blocks/index.ts')).toContain("import('./b')).BPage");
    expect(result.install).toBe('pnpm add date-fns@^4.1.0');
  });

  it('adds and removes a block in a Next app: its page generated and recorded in the lock, then gone again', () => {
    const { app, catalogue } = setup();
    writeLock(app, 'aaaaaaa', readTree(app), [], { starter: 'mohammadsafia/rsk-next-starter', target: 'next' });
    addBlocks({ appDir: app, catalogue, ids: ['b'] });
    const page = 'app/[lang]/(app)/b/page.tsx';
    expect(read(app, page)).toContain('return <BPage />;');
    const lock = JSON.parse(read(app, 'kit.lock.json'));
    expect(Object.keys(lock.generated)).toEqual(expect.arrayContaining([page, 'app/[lang]/error.tsx', 'app/global-not-found.tsx']));
    expect(read(app, 'src/blocks/index.ts')).toContain('export const blockNav: AppMenu[] = [];');
    const removed = removeBlocks({ appDir: app, ids: ['b', 'a'] });
    expect(removed.kept).toEqual([]);
    expect(existsSync(path.join(app, page))).toBe(false);
    expect(JSON.parse(read(app, 'kit.lock.json')).generated).not.toHaveProperty([page]);
  });

  it('refuses to add a Next block over a page the app wrote itself, and writes nothing', () => {
    const { app, catalogue } = setup();
    writeLock(app, 'aaaaaaa', readTree(app), [], { starter: 'mohammadsafia/rsk-next-starter', target: 'next' });
    put(app, 'app/[lang]/(app)/b/page.tsx', 'export default function Mine() {\n  return null;\n}\n');
    const before = read(app, 'kit.lock.json');
    expect(() => addBlocks({ appDir: app, catalogue, ids: ['b'] })).toThrow(
      "app/[lang]/(app)/b/page.tsx isn't a page kit:add wrote (or you changed it); move it away to add a, b.",
    );
    expect(read(app, 'kit.lock.json')).toBe(before);
    expect(existsSync(path.join(app, 'src/blocks/a'))).toBe(false);
  });

  it('refuses to overwrite a file the app already has with different content, and writes nothing', () => {
    const { app, catalogue } = setup();
    put(app, 'src/blocks/a/index.ts', 'my own\n');
    expect(() => addBlocks({ appDir: app, catalogue, ids: ['a'] })).toThrow(/src\/blocks\/a\/index\.ts already exists/);
    expect(existsSync(path.join(app, 'src/locales/en/block-a.json'))).toBe(false);
  });

  it('is a no-op for a block already added', () => {
    const { app, catalogue } = setup();
    addBlocks({ appDir: app, catalogue, ids: ['a'] });
    expect(addBlocks({ appDir: app, catalogue, ids: ['a'] }).added).toEqual([]);
  });
});

describe('kit:remove', () => {
  it('removes a block, its locales and lock entries, and regenerates the index', () => {
    const { app, catalogue } = setup();
    addBlocks({ appDir: app, catalogue, ids: ['b'] });
    removeBlocks({ appDir: app, ids: ['b'] });
    expect(existsSync(path.join(app, 'src/blocks/b'))).toBe(false);
    expect(existsSync(path.join(app, 'src/locales/en/block-b.json'))).toBe(false);
    const lock = JSON.parse(read(app, 'kit.lock.json'));
    expect(lock.blocks).toEqual(['a']);
    expect(Object.keys(lock.files).some((file) => file.includes('/b/'))).toBe(false);
    expect(read(app, 'src/blocks/index.ts')).not.toContain("'./b'");
  });

  it('refuses to remove a block another added block depends on, or one the app changed, unless forced', () => {
    const { app, catalogue } = setup();
    addBlocks({ appDir: app, catalogue, ids: ['b'] });
    expect(() => removeBlocks({ appDir: app, ids: ['a'] })).toThrow(/"b" depends on it/);
    put(app, 'src/blocks/b/index.ts', 'export const BPage = () => "mine";\n');
    expect(() => removeBlocks({ appDir: app, ids: ['b'] })).toThrow(/you changed src\/blocks\/b\/index\.ts/);
    removeBlocks({ appDir: app, ids: ['b'], force: true });
    expect(existsSync(path.join(app, 'src/blocks/b'))).toBe(false);
  });
});

describe('kit:remove keeps the app’s own work', () => {
  it('refuses to delete a file the app put in a block’s folder, unless forced, and otherwise removes only the block’s files', () => {
    const { app, catalogue } = setup();
    addBlocks({ appDir: app, catalogue, ids: ['c'] });
    put(app, 'src/blocks/c/mine.ts', 'export const mine = 1;\n');
    expect(() => removeBlocks({ appDir: app, ids: ['c'] })).toThrow(/src\/blocks\/c\/mine\.ts isn't one of "c"'s files/);
    expect(existsSync(path.join(app, 'src/blocks/c/mine.ts'))).toBe(true);
    removeBlocks({ appDir: app, ids: ['c'], force: true });
    expect(existsSync(path.join(app, 'src/blocks/c'))).toBe(false);
  });
});

describe('the block index follows the app’s own blocks', () => {
  it('keeps a block the latest catalogue no longer has, and reads dependents from the app', () => {
    const { app, catalogue } = setup();
    addBlocks({ appDir: app, catalogue, ids: ['b'] });
    // The registry dropped b since: adding c must not unroute it, and a (which b needs) still can't be removed.
    const withoutB = { ...catalogue, blocks: catalogue.blocks.filter((meta) => meta.id !== 'b') };
    addBlocks({ appDir: app, catalogue: withoutB, ids: ['c'] });
    expect(read(app, 'src/blocks/index.ts')).toContain("import('./b')).BPage");
    expect(read(app, 'src/blocks/index.ts')).toContain("import('./c')).CPage");
    expect(() => removeBlocks({ appDir: app, ids: ['a'] })).toThrow(/"b" depends on it/);
  });
});

describe('kit:add and the app’s kit version', () => {
  it('refuses blocks from a newer kit than the app has, and says to update first', () => {
    const { app, starter } = setup();
    writeLock(starter, 'bbbbbbb', new Map(), []);
    expect(() => addBlocks({ appDir: app, catalogue: readCatalogue(starter), ids: ['a'] })).toThrow(/pnpm kit:update first/);
    expect(existsSync(path.join(app, 'src/blocks/a'))).toBe(false);
  });

  it('names what an app from before blocks still needs, and nothing for an app that has it', () => {
    const { app } = setup();
    expect(wiringGaps(app).join('\n')).toMatch(/src\/routes\/router\.tsx/);
    expect(wiringGaps(app).join('\n')).toMatch(/@locales\/\*/);
    // The starter's wiring: its overlay in the kit, its own src/routes in an app made from it.
    const root = path.resolve(import.meta.dirname, '../..');
    // The Vite overlay (overlay/vite once the overlay splits by target).
    const split = path.join(root, 'scripts/starter/overlay/vite');
    const overlay = existsSync(split) ? split : path.join(root, 'scripts/starter/overlay');
    expect(wiringGaps(existsSync(overlay) ? overlay : root, root)).toEqual([]);
  });
});

describe('the picker’s ranking', () => {
  it('puts a name or tag match before a match only in the description, and keeps catalogue order otherwise', () => {
    const blocks = [
      block('invite-members-dialog', { title: 'Invite members dialog', description: 'Invites with per-address errors.' }),
      block('search-field', { title: 'Search field', tags: ['search'] }),
      block('system-pages', { title: 'System pages', tags: ['error', '404'] }),
    ];
    // block() is untyped test data; rankBlocks reads only id, title, tags, level, family and description.
    const ranked = (search: string) => rankBlocks(blocks as Parameters<typeof rankBlocks>[0], search).map((meta) => meta.id);
    expect(ranked('error')).toEqual(['system-pages', 'invite-members-dialog', 'search-field']);
    expect(ranked('search')).toEqual(['search-field', 'invite-members-dialog', 'system-pages']);
    expect(ranked('')).toEqual(['invite-members-dialog', 'search-field', 'system-pages']);
  });
});
