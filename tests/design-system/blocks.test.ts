// The block catalogue: every block is valid, documented, built only from the kit, and translated into both languages.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { blockFiles, readBlocks, validateBlocks } from '../../scripts/kit/blocks';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DOCS = ['molecules', 'organisms', 'templates'].map((folder) => path.join(ROOT, 'src/component-docs', folder));

/** The leaf keys of a locale file, with plural suffixes folded (Arabic has more plural forms than English). */
const keysOf = (file: string): string[] => {
  const walk = (value: unknown, prefix: string): string[] =>
    value && typeof value === 'object'
      ? Object.entries(value).flatMap(([key, child]) => walk(child, prefix ? `${prefix}.${key}` : key))
      : [prefix.replace(/_(zero|one|two|few|many|other)$/, '')];
  return [...new Set(walk(JSON.parse(readFileSync(path.join(ROOT, file), 'utf8')), ''))].sort();
};

const blocks = readBlocks(ROOT);

describe('block catalogue', () => {
  it('is valid: ids match folders, levels are known, both locales exist, dependencies and routes resolve', () => {
    expect(validateBlocks(ROOT)).toEqual([]);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it('documents every block in the docs Blocks section', () => {
    const ids = DOCS.filter(existsSync).flatMap((dir) =>
      readdirSync(dir)
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => /^id:\s*(\S+)/m.exec(readFileSync(path.join(dir, file), 'utf8'))?.[1]),
    );
    for (const block of blocks) expect(ids, `no docs page for "${block.id}"`).toContain(block.id);
  });

  it('builds blocks only from the kit: no app pages, showcase or clinic API', () => {
    const offending = blocks.flatMap((block) =>
      blockFiles(ROOT, block.id)
        .filter((file) => /\.tsx?$/.test(file))
        .filter((file) =>
          /from ['"](?:@pages\/|@views\/|@api\/clinic|@routes|[./]*src\/pages)/.test(readFileSync(path.join(ROOT, file), 'utf8')),
        ),
    );
    expect(offending).toEqual([]);
  });

  it.each(blocks.map((block) => [block.id]))('%s has the same keys in English and Arabic', (id) => {
    expect(keysOf(`src/locales/ar/block-${id}.json`)).toEqual(keysOf(`src/locales/en/block-${id}.json`));
  });
});
