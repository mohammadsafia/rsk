// tests/design-system/dependencies.test.ts
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { corpusFiles } from './dependency-corpus';
import { checkEntryScripts, checkEnvDeclarations, checkRouterDependency, envDeclarationFiles } from './target-checks';

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
  // A Next app's framework and its Tailwind PostCSS plugin, named by config files and the CLI rather than imported.
  'next',
  '@tailwindcss/postcss',
  'postcss',
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
    const declarations = envDeclarationFiles(ROOT);
    const readers = tracked.filter((file) => !declarations.includes(file) && !file.endsWith('.md'));
    expect(checkEnvDeclarations(ROOT, readers.map((file) => readFileSync(`${ROOT}${file}`, 'utf8')).join('\n'))).toEqual([]);
  });

  it('routes come from the framework (Vite: react-router 8, which has no react-router-dom; Next: its own router)', () => {
    // Built in two pieces so this file doesn't match itself.
    expect(corpus.includes(`from '${'react-router'}-dom'`)).toBe(false);
    expect(checkRouterDependency(ROOT)).toEqual([]);
  });

  it('index.html loads no local script that does not exist (a 404 on every page load); a Next app has none', () => {
    expect(checkEntryScripts(ROOT, (file) => tracked.includes(file))).toEqual([]);
  });
});
