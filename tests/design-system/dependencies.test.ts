// tests/design-system/dependencies.test.ts
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { corpusFiles } from './dependency-corpus';

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
  // Babel peers of @rolldown/plugin-babel + the React Compiler preset (loaded by name, never imported).
  '@babel/core',
  'babel-plugin-react-compiler',
  // The highlighter rehype-pretty-code (the docs' code blocks) requires as a peer and loads by name.
  'shiki',
]);

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.starter', 'docs', '.superpowers', 'coverage']);

/**
 * Repo files: in a git checkout, the tracked ones plus new ones not ignored (an app just made with vp create has
 * committed nothing yet); else a walk of the tree (the generated starter is not a git repo).
 */
const listFiles = (): string[] => {
  try {
    return execSync('git ls-files --cached --others --exclude-standard', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    const walk = (dir: string): string[] =>
      readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
        const path = dir ? `${dir}/${entry.name}` : entry.name;
        if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(path);
        return [path];
      });
    return walk('');
  }
};

const tracked = corpusFiles(listFiles(), ROOT);
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
    // Comment lines are documentation (an example key), not declarations.
    const declarations = readFileSync(`${ROOT}src/vite-env.d.ts`, 'utf8').replace(/^\s*\/\/.*$/gm, '');
    const declared = declarations.match(/\bVITE_[A-Z0-9_]+/g) ?? [];
    const readers = tracked.filter((file) => file !== 'src/vite-env.d.ts' && file !== '.env' && !file.endsWith('.md'));
    const read = readers.map((file) => readFileSync(`${ROOT}${file}`, 'utf8')).join('\n');
    expect([...new Set(declared)].filter((name) => !read.includes(name))).toEqual([]);
  });

  it('routes come from react-router (v8 has no react-router-dom)', () => {
    // Built in two pieces so this file doesn't match itself.
    expect(corpus.includes(`from '${'react-router'}-dom'`)).toBe(false);
    expect(pkg.dependencies?.['react-router']).toMatch(/^\^8/);
  });

  it('index.html loads no local script that does not exist (a 404 on every page load)', () => {
    const html = readFileSync(`${ROOT}index.html`, 'utf8');
    const local = [...html.matchAll(/<script[^>]+src="\/([^"]+)"/g)].map((match) => match[1]);
    expect(local.filter((src) => !tracked.includes(src) && !tracked.includes(`public/${src}`))).toEqual([]);
  });
});
