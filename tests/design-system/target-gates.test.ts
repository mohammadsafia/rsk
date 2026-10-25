// The kit's gates check a Next app's own config when the app's target is next: a Next-shaped fixture passes every
// target check, and each check catches the matching mistake.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  checkA11yScript,
  checkCompilerConfig,
  checkEntryScripts,
  checkEnvDeclarations,
  checkFaviconLinks,
  checkFontLoading,
  checkRouterDependency,
  checkTypecheckProjects,
  NEXT_LAYOUT,
  sourceRoots,
} from './target-checks';

const LAYOUT = `import { Noto_Kufi_Arabic, Schibsted_Grotesk, Spline_Sans_Mono } from 'next/font/google';
export const metadata = {
  icons: { icon: [{ url: '/favicon.svg' }, { url: '/favicon.ico' }], apple: '/apple-touch-icon.png' },
  manifest: '/site.webmanifest',
};
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000' },
    { media: '(prefers-color-scheme: light)', color: '#fff' },
  ],
};`;

const FILES: Record<string, string> = {
  'kit.lock.json': JSON.stringify({ kit: 'aaaaaaa', starter: 'mohammadsafia/rsk-next-starter', target: 'next', files: {} }),
  'next.config.ts': "export default { reactCompiler: true, typescript: { tsconfigPath: 'tsconfig.app.json' } };",
  'package.json': JSON.stringify({
    dependencies: { next: '^16.4.2', react: '^19.3.1' },
    scripts: { 'a11y:audit': 'node scripts/a11y/audit.mjs --url http://localhost:3000' },
  }),
  'tsconfig.json': JSON.stringify({ files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.scripts.json' }] }),
  'tsconfig.app.json': JSON.stringify({ include: ['src', 'app', 'next-env.d.ts', '.next/types/**/*.ts', '.next/dev/types/**/*.ts'] }),
  'tsconfig.scripts.json': JSON.stringify({ extends: './tsconfig.app.json', include: ['scripts', 'tests', 'src/**/*.d.ts'] }),
  '.env.example': '# The API the server calls.\nAPI_URL=http://localhost:4000\nNEXT_PUBLIC_SITE_URL=http://localhost:3000\n',
  [NEXT_LAYOUT]: LAYOUT,
};

let dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

/** A Next app's top-level files, with `changes` applied (null deletes a file). */
const nextApp = (changes: Record<string, string | null> = {}): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kit-next-app-'));
  dirs.push(dir);
  for (const [file, content] of Object.entries({ ...FILES, ...changes })) {
    if (content === null) continue;
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
};

describe('target-aware gates in a Next app', () => {
  it('a well-formed Next app passes every target check', () => {
    const dir = nextApp();
    expect(checkCompilerConfig(dir)).toEqual([]);
    expect(checkRouterDependency(dir)).toEqual([]);
    expect(checkEnvDeclarations(dir, 'process.env.API_URL; process.env.NEXT_PUBLIC_SITE_URL')).toEqual([]);
    expect(checkEntryScripts(dir, () => false)).toEqual([]);
    expect(checkFaviconLinks(dir)).toEqual([]);
    expect(checkTypecheckProjects(dir)).toEqual([]);
    expect(checkA11yScript(dir)).toEqual([]);
    expect(checkFontLoading(dir)).toEqual([]);
    expect(sourceRoots(dir)).toEqual(['src', 'app']);
  });

  it('catches the React Compiler switched off', () => {
    expect(checkCompilerConfig(nextApp({ 'next.config.ts': 'export default {};' }))).toEqual([
      'next.config does not set reactCompiler: true',
    ]);
  });

  it('catches React Router in a Next app', () => {
    const pkg = JSON.stringify({ dependencies: { next: '^16.4.2', 'react-router': '^8.4.0' } });
    expect(checkRouterDependency(nextApp({ 'package.json': pkg }))).toEqual(['react-router is a dependency of a Next app']);
  });

  it('catches an env key nothing reads', () => {
    expect(checkEnvDeclarations(nextApp(), 'process.env.API_URL')).toEqual(['NEXT_PUBLIC_SITE_URL is declared but nothing reads it']);
  });

  it('catches missing favicon metadata and fonts in the root layout', () => {
    const dir = nextApp({ [NEXT_LAYOUT]: 'export const metadata = {};' });
    expect(checkFaviconLinks(dir)).toContain(`${NEXT_LAYOUT} lacks icons:`);
    expect(checkFontLoading(dir)).toContain(`${NEXT_LAYOUT} (or app/fonts.ts) lacks from 'next/font/google'`);
  });

  it('catches an app project that leaves out app/ or Next’s types', () => {
    const dir = nextApp({ 'tsconfig.app.json': JSON.stringify({ include: ['src'] }) });
    expect(checkTypecheckProjects(dir)).toEqual([
      'tsconfig.app.json does not include app',
      'tsconfig.app.json does not include next-env.d.ts',
      'tsconfig.app.json does not include .next/types/**/*.ts',
    ]);
  });

  it('reads tsconfig files the way TypeScript does: block comments and trailing commas', () => {
    const dir = nextApp({
      'tsconfig.app.json': `{\n  "compilerOptions": {\n    /* Bundler mode */\n    "strict": true, // on\n  },\n  "include": ["src", "app", "next-env.d.ts", ".next/types/**/*.ts",],\n}\n`,
    });
    expect(checkTypecheckProjects(dir)).toEqual([]);
  });

  it('finds the fonts in app/fonts.ts, which the root layout and the global 404 share', () => {
    const fonts = "import { Noto_Kufi_Arabic, Schibsted_Grotesk, Spline_Sans_Mono } from 'next/font/google';";
    const dir = nextApp({ [NEXT_LAYOUT]: LAYOUT.split('\n').slice(1).join('\n'), 'app/fonts.ts': fonts });
    expect(checkFontLoading(dir)).toEqual([]);
  });

  it('catches an index.html left in a Next app', () => {
    expect(checkEntryScripts(nextApp({ 'index.html': '<html></html>' }), () => true)).toEqual(['a Next app ships an index.html']);
  });

  it('without a lock, a next.config file is enough to check the app as Next', () => {
    expect(checkCompilerConfig(nextApp({ 'kit.lock.json': null }))).toEqual([]);
  });
});
