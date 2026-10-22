// The kit is one source for Vite and Next apps: no kit-owned file may import a router or a framework, or use Vite-only
// APIs. Framework code lives in each starter's app-owned files (src/routes/routerAdapter.tsx, the router, app/).
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parseSync } from '@babel/core';
import { describe, expect, it } from 'vite-plus/test';

import { readTree } from '../../scripts/kit/core';

const ROOT = path.resolve(import.meta.dirname, '../..');
const kitFiles = [...readTree(ROOT).keys()].filter((file) => /\.(tsx?|mjs)$/.test(file));

const FORBIDDEN = [/^react-router(\/|$)/, /^next(\/|$)/];
const VITE_APIS = [
  ['env', /import\.meta\.env\b/],
  ['glob', /import\.meta\.glob\b/],
] as const;

/** Module names a file imports or re-exports, from its syntax (a generator's template text is not an import). */
const importsOf = (file: string, source: string): string[] => {
  const ast = parseSync(source, {
    filename: file,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: file.endsWith('.tsx') ? ['typescript', 'jsx'] : ['typescript'] },
  });
  return (ast?.program.body ?? []).flatMap((node) =>
    (node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration') && node.source
      ? [node.source.value]
      : [],
  );
};

const offences = (file: string): string[] => {
  const source = readFileSync(path.join(ROOT, file), 'utf8');
  const found = importsOf(file, source)
    .filter((name) => FORBIDDEN.some((pattern) => pattern.test(name)))
    .map((name) => `imports ${name}`);
  // The kit's Node scripts may read import.meta.dirname; app code may not lean on Vite's import.meta.
  if (!file.startsWith('scripts/')) {
    for (const [api, pattern] of VITE_APIS) {
      // Tests may glob their fixtures; nothing else may.
      if (pattern.test(source) && !(api === 'glob' && /\.test\./.test(file))) found.push(`uses import.meta.${api}`);
    }
  }
  return found.map((offence) => `${file}: ${offence}`);
};

describe('framework-free kit', () => {
  it('scans the kit-owned files', () => {
    expect(kitFiles.length).toBeGreaterThan(100);
    expect(kitFiles).toContain('src/components/ui/sections/Sections.tsx');
    expect(kitFiles).not.toContain('src/blocks/index.ts');
  });

  it('no kit-owned file imports react-router or next, or uses Vite-only APIs', () => {
    expect(kitFiles.flatMap(offences)).toEqual([]);
  });
});
