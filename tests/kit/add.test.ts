import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { addBlocks, readCatalogue, removeBlocks } from '../../scripts/kit/add';
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
  ];
  put(starter, 'registry/index.json', JSON.stringify(blocks));
  for (const meta of blocks) {
    put(starter, `registry/blocks/${meta.id}/block.json`, JSON.stringify(meta));
    put(
      starter,
      `registry/blocks/${meta.id}/files/src/blocks/${meta.id}/index.ts`,
      meta.id === 'b' ? 'export const BPage = () => null;\n' : 'export {};\n',
    );
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
    removeBlocks({ appDir: app, catalogue, ids: ['b'] });
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
    expect(() => removeBlocks({ appDir: app, catalogue, ids: ['a'] })).toThrow(/"b" depends on it/);
    put(app, 'src/blocks/b/index.ts', 'export const BPage = () => "mine";\n');
    expect(() => removeBlocks({ appDir: app, catalogue, ids: ['b'] })).toThrow(/you changed src\/blocks\/b\/index\.ts/);
    removeBlocks({ appDir: app, catalogue, ids: ['b'], force: true });
    expect(existsSync(path.join(app, 'src/blocks/b'))).toBe(false);
  });
});
