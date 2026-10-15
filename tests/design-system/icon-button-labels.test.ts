import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

// Gallery demos are English documentation fixtures, like the MDX around them.
const DOCS_DEMOS = new Set(['components.data.demos.tsx']);

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx') && !DOCS_DEMOS.has(entry.name) ? [path] : [];
  });

// An opening <IconButton …> tag; `(?<!=)>` skips the `>` of arrow functions inside props.
const ICON_BUTTON_TAG = /<IconButton\b[\s\S]*?(?<!=)>/g;

describe('IconButton labels', () => {
  // IconButton shows aria-label as its tooltip, so a string literal is untranslated visible text.
  it('never uses a hard-coded aria-label string', () => {
    const offenders = sourceFiles(SRC).flatMap((file) =>
      (readFileSync(file, 'utf8').match(ICON_BUTTON_TAG) ?? [])
        .filter((tag) => /aria-label="/.test(tag))
        .map((tag) => `${relative(SRC, file)}: ${tag.match(/aria-label="[^"]*"/)?.[0]}`),
    );

    expect(offenders).toEqual([]);
  });
});
