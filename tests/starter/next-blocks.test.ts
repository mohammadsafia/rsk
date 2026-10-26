// Blocks in a real Next starter: kit:add, kit:remove and kit:update over the generated App Router files.
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test';

import { addBlocks, readCatalogue, removeBlocks } from '../../scripts/kit/add';
import { generateBlockIndex, readBlocks } from '../../scripts/kit/blocks';
import { applyUpdate, hashFile, readLock, stageUpstream } from '../../scripts/kit/core';
import { buildStarter } from '../../scripts/starter/build-starter';

let starter = '';
const temporary: string[] = [];

beforeAll(() => {
  starter = buildStarter(mkdtempSync(path.join(os.tmpdir(), 'rsk-next-blocks-')), 'next');
  temporary.push(starter);
});

afterAll(() => {
  for (const dir of temporary) rmSync(dir, { recursive: true, force: true });
});

/** A fresh app made from the starter. */
const newApp = () => {
  const app = mkdtempSync(path.join(os.tmpdir(), 'rsk-next-app-'));
  temporary.push(app);
  cpSync(starter, app, { recursive: true });
  return app;
};
const read = (root: string, file: string) => readFileSync(path.join(root, file), 'utf8');
const walk = (root: string, dir = ''): string[] =>
  readdirSync(path.join(root, dir)).flatMap((name) => {
    const rel = dir ? `${dir}/${name}` : name;
    return statSync(path.join(root, rel)).isDirectory() ? walk(root, rel) : [rel];
  });
const fingerprint = (root: string) => Object.fromEntries(walk(root).map((file) => [file, hashFile(path.join(root, file))]));

const PAGES = ['app/[lang]/(app)/no-access/page.tsx', 'app/[lang]/maintenance/page.tsx'];
const FRAMEWORK = ['app/[lang]/error.tsx', 'app/[lang]/not-found.tsx', 'app/global-not-found.tsx'];

describe('blocks in a Next app', () => {
  it('the starter records its 404 and error defaults as generated', () => {
    expect(Object.keys(readLock(starter).generated ?? {}).sort()).toEqual(FRAMEWORK);
  });

  it('adds system-pages: its pages, 404 and error from the block, recorded in the lock', () => {
    const app = newApp();
    addBlocks({ appDir: app, catalogue: readCatalogue(app), ids: ['system-pages'] });
    for (const file of [...PAGES, ...FRAMEWORK]) expect(read(app, file).split('\n')[0], file).toContain('from the "system-pages" block');
    const lock = readLock(app);
    expect(lock.blocks).toEqual(['system-pages']);
    for (const file of [...PAGES, ...FRAMEWORK]) expect(lock.generated?.[file], file).toBe(hashFile(path.join(app, file)));
    expect(read(app, 'src/blocks/index.ts')).toBe(generateBlockIndex(readBlocks(app), 'next'));
  });

  it('refuses to add over an edited 404 and writes nothing', () => {
    const app = newApp();
    writeFileSync(path.join(app, 'app/[lang]/not-found.tsx'), "'use client';\n\nexport default function Mine() {\n  return null;\n}\n");
    const before = fingerprint(app);
    expect(() => addBlocks({ appDir: app, catalogue: readCatalogue(app), ids: ['system-pages'] })).toThrow(
      "app/[lang]/not-found.tsx isn't a page kit:add wrote (or you changed it); move it away to add system-pages.",
    );
    expect(fingerprint(app)).toEqual(before);
  });

  it('an edited error page stops only the blocks that would replace it, and the refusal lists every file in the way', () => {
    const app = newApp();
    const edited = `${read(app, 'app/[lang]/error.tsx')}// ours\n`;
    writeFileSync(path.join(app, 'app/[lang]/error.tsx'), edited);
    addBlocks({ appDir: app, catalogue: readCatalogue(app), ids: ['search-field'] });
    expect(readLock(app).blocks).toEqual(['search-field']);
    expect(read(app, 'app/[lang]/error.tsx')).toBe(edited);
    writeFileSync(path.join(app, 'app/[lang]/not-found.tsx'), `${read(app, 'app/[lang]/not-found.tsx')}// ours\n`);
    expect(() => addBlocks({ appDir: app, catalogue: readCatalogue(app), ids: ['system-pages'] })).toThrow(
      "app/[lang]/error.tsx, app/[lang]/not-found.tsx aren't pages kit:add wrote (or you changed them); move them away to add system-pages.",
    );
  });

  it("removes the block's unedited pages and brings the starter defaults back", () => {
    const app = newApp();
    const before = fingerprint(app);
    addBlocks({ appDir: app, catalogue: readCatalogue(app), ids: ['system-pages'] });
    const result = removeBlocks({ appDir: app, ids: ['system-pages'] });
    expect(result.kept).toEqual([]);
    expect(fingerprint(app)).toEqual(before);
  });

  it('leaves an edited block page on remove, and says so', () => {
    const app = newApp();
    addBlocks({ appDir: app, catalogue: readCatalogue(app), ids: ['system-pages'] });
    writeFileSync(path.join(app, PAGES[1]), `${read(app, PAGES[1])}// mine\n`);
    const result = removeBlocks({ appDir: app, ids: ['system-pages'] });
    expect(result.kept).toEqual([PAGES[1]]);
    expect(existsSync(path.join(app, PAGES[1]))).toBe(true);
    expect(readLock(app).generated).not.toHaveProperty([PAGES[1]]);
    expect(existsSync(path.join(app, PAGES[0]))).toBe(false);
  });

  it('kit:update follows a renamed route: the old page goes, the new one comes, nothing is left behind', () => {
    const app = newApp();
    addBlocks({ appDir: app, catalogue: readCatalogue(app), ids: ['system-pages'] });
    const upstream = mkdtempSync(path.join(os.tmpdir(), 'rsk-next-upstream-'));
    temporary.push(upstream);
    cpSync(starter, upstream, { recursive: true });
    const meta = path.join(upstream, 'registry/blocks/system-pages/files/src/blocks/system-pages/block.json');
    writeFileSync(
      meta,
      read(upstream, 'registry/blocks/system-pages/files/src/blocks/system-pages/block.json').replace('/no-access', '/forbidden'),
    );
    const view = stageUpstream(upstream, ['system-pages']);
    temporary.push(view);
    applyUpdate({ appDir: app, upstreamDir: view, kit: readLock(app).kit });
    expect(existsSync(path.join(app, 'app/[lang]/(app)/forbidden/page.tsx'))).toBe(true);
    expect(existsSync(path.join(app, 'app/[lang]/(app)/no-access'))).toBe(false);
    expect(Object.keys(readLock(app).generated ?? {})).not.toContain(PAGES[0]);
  });
});
