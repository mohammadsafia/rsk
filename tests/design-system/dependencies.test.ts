// tests/design-system/dependencies.test.ts
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const pkg = JSON.parse(readFileSync(`${ROOT}package.json`, 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

/** Used without an import: types, test environments named in file headers, peers other packages require. */
const IMPLICIT_DEPENDENCIES = new Set([
  '@types/react',
  '@types/react-dom',
  '@types/node',
  '@types/mdx',
  'happy-dom',
  '@testing-library/dom',
  'react-is',
  'typescript',
  'vite',
  'vite-plus',
  'tailwindcss',
  'tw-animate-css',
  '@tailwindcss/vite',
  'tsx',
  // Kept for the WCAG sweep; scripts/a11y/audit.mjs imports it from Task 11 of the React 19 plan.
  'axe-core',
]);

const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((file) => /\.(ts|tsx|mts|mjs|js|css|mdx|json|ya?ml|html)$/.test(file) && !/(^|\/)(package\.json|pnpm-lock\.yaml)$/.test(file));
const corpus = tracked.map((file) => readFileSync(`${ROOT}${file}`, 'utf8')).join('\n') + JSON.stringify(pkg.scripts ?? {});

const used = (name: string) =>
  corpus.includes(`'${name}'`) ||
  corpus.includes(`"${name}"`) ||
  corpus.includes(`'${name}/`) ||
  corpus.includes(`"${name}/`) ||
  corpus.includes(`@import '${name}`) ||
  corpus.includes(` ${name} `);

describe('dependencies', () => {
  it('lists nothing the code does not use', () => {
    const declared = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
    expect(declared.filter((name) => !IMPLICIT_DEPENDENCIES.has(name) && !used(name))).toEqual([]);
  });

  it('every package.json script points at something that exists', () => {
    const missing = Object.entries(pkg.scripts ?? {})
      .flatMap(([script, command]) => [...command.matchAll(/(?:node|tsx)\s+(\S+\.(?:[cm]?[jt]s))/g)].map((m) => [script, m[1]]))
      .filter(([, file]) => !tracked.includes(file));
    expect(missing).toEqual([]);
  });

  it('declares no environment variable that nothing reads', () => {
    const declared = readFileSync(`${ROOT}src/vite-env.d.ts`, 'utf8').match(/\bVITE_[A-Z0-9_]+/g) ?? [];
    const readers = tracked.filter((file) => file !== 'src/vite-env.d.ts' && file !== '.env' && !file.endsWith('.md'));
    const read = readers.map((file) => readFileSync(`${ROOT}${file}`, 'utf8')).join('\n');
    expect([...new Set(declared)].filter((name) => !read.includes(name))).toEqual([]);
  });
});
