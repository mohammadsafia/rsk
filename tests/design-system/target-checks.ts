// tests/design-system/target-checks.ts — the parts of the kit's gates that depend on the app's framework. Each check
// reads an app (or this repository) at `root` and returns its problems, [] when fine: a Vite app is checked against
// vite.config.ts and index.html, a Next app against next.config and its root layout. kitTarget() tells them apart.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { kitTarget } from '../../scripts/lib/kit-target.mjs';

type Pkg = { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; scripts?: Record<string, string> };

const NEXT_CONFIGS = ['next.config.ts', 'next.config.mjs', 'next.config.js'];
/** A Next app's root layout: metadata, icons and fonts live there. */
export const NEXT_LAYOUT = 'app/[lang]/layout.tsx';
/** Where a Next app may load its next/font families, shared by its root documents. */
export const NEXT_FONTS = 'app/fonts.ts';

const read = (root: string, file: string): string => (existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), 'utf8') : '');
const readPkg = (root: string): Pkg => JSON.parse(read(root, 'package.json') || '{}') as Pkg;
/** JSON with comments, as tsconfig files are: line and block comments (outside strings) and trailing commas dropped. */
export function parseJsonc(text: string): unknown {
  let json = '';
  let index = 0;
  while (index < text.length) {
    if (text[index] === '"') {
      // A string, escapes included, copied as it is.
      let close = index + 1;
      while (close < text.length && text[close] !== '"') close += text[close] === '\\' ? 2 : 1;
      json += text.slice(index, close + 1);
      index = close + 1;
    } else if (text.startsWith('//', index)) {
      const newline = text.indexOf('\n', index);
      index = newline === -1 ? text.length : newline;
    } else if (text.startsWith('/*', index)) {
      index = text.indexOf('*/', index) + 2;
    } else {
      json += text[index];
      index += 1;
    }
  }
  return JSON.parse(json.replace(/,(\s*[}\]])/g, '$1') || '{}');
}

const readTsconfig = (root: string, file: string): Record<string, unknown> => parseJsonc(read(root, file)) as Record<string, unknown>;
const nextConfig = (root: string): string => NEXT_CONFIGS.map((file) => read(root, file)).find(Boolean) ?? '';
const missing = (source: string, needles: string[], where: string): string[] =>
  needles.filter((needle) => !source.includes(needle)).map((needle) => `${where} lacks ${needle}`);

/** The folders whose sources the kit's scans read: src/, plus a Next app's app/. */
export const sourceRoots = (root: string): string[] => ['src', ...(existsSync(path.join(root, 'app')) ? ['app'] : [])];

/** The React Compiler builds the app: Vite through the React plugin's preset, Next through reactCompiler. */
export function checkCompilerConfig(root: string): string[] {
  if (kitTarget(root) === 'next') {
    const config = nextConfig(root);
    if (!config) return ['no next.config file'];
    return /reactCompiler:\s*true/.test(config) ? [] : ['next.config does not set reactCompiler: true'];
  }
  const config = read(root, 'vite.config.ts');
  const problems = missing(config, ["from '@vitejs/plugin-react'", 'reactCompilerPreset'], 'vite.config.ts');
  if (config.includes('plugin-react-swc')) problems.push('vite.config.ts builds with SWC');
  return problems;
}

/** Routing comes from the framework: React Router 8 in a Vite app, Next's own router (and no React Router) in a Next app. */
export function checkRouterDependency(root: string): string[] {
  const { dependencies = {} } = readPkg(root);
  if (kitTarget(root) === 'next') {
    return [
      ...(dependencies.next ? [] : ['next is not a dependency']),
      ...(dependencies['react-router'] ? ['react-router is a dependency of a Next app'] : []),
    ];
  }
  return /^\^8/.test(dependencies['react-router'] ?? '') ? [] : ['react-router ^8 is not a dependency'];
}

/** Every declared environment variable is read somewhere: VITE_* in vite-env.d.ts, NEXT_PUBLIC_* and server keys in .env.example. */
export function checkEnvDeclarations(root: string, readers: string): string[] {
  const next = kitTarget(root) === 'next';
  // Comment lines are documentation (an example key), not declarations.
  const declarations = read(root, next ? '.env.example' : 'src/vite-env.d.ts').replace(/^\s*(\/\/|#).*$/gm, '');
  const declared = next
    ? [...declarations.matchAll(/^\s*([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1])
    : (declarations.match(/\bVITE_[A-Z0-9_]+/g) ?? []);
  return [...new Set(declared)].filter((name) => !readers.includes(name)).map((name) => `${name} is declared but nothing reads it`);
}

/** The files the env check must not count as readers: the declarations themselves and local env files. */
export const envDeclarationFiles = (root: string): string[] =>
  kitTarget(root) === 'next' ? ['.env.example', '.env'] : ['src/vite-env.d.ts', '.env'];

/** A Vite app's index.html loads only local scripts that exist; a Next app has no index.html. */
export function checkEntryScripts(root: string, exists: (file: string) => boolean): string[] {
  if (kitTarget(root) === 'next') return existsSync(path.join(root, 'index.html')) ? ['a Next app ships an index.html'] : [];
  const html = read(root, 'index.html');
  const local = [...html.matchAll(/<script[^>]+src="\/([^"]+)"/g)].map((match) => match[1]);
  return local.filter((src) => !exists(src) && !exists(`public/${src}`)).map((src) => `index.html loads a missing /${src}`);
}

/** The pages declare the favicon set and the theme colours: index.html (Vite) or the root layout's metadata (Next). */
export function checkFaviconLinks(root: string): string[] {
  if (kitTarget(root) === 'next') {
    const layout = read(root, NEXT_LAYOUT);
    return missing(
      layout,
      [
        'icons:',
        "'/favicon.svg'",
        "'/favicon.ico'",
        "'/apple-touch-icon.png'",
        "manifest: '/site.webmanifest'",
        "'(prefers-color-scheme: dark)'",
        "'(prefers-color-scheme: light)'",
      ],
      NEXT_LAYOUT,
    );
  }
  const html = read(root, 'index.html');
  const problems = missing(
    html,
    [
      '<link rel="icon" type="image/svg+xml" href="/favicon.svg"',
      '<link rel="icon" href="/favicon.ico" sizes="32x32"',
      '<link rel="apple-touch-icon" href="/apple-touch-icon.png"',
      '<link rel="manifest" href="/site.webmanifest"',
    ],
    'index.html',
  );
  for (const scheme of ['dark', 'light'])
    if (!new RegExp(`<meta name="theme-color" media="\\(prefers-color-scheme: ${scheme}\\)"`).test(html))
      problems.push(`index.html lacks the ${scheme} theme-color`);
  return problems;
}

/** `tsc -b` type-checks scripts/ and tests/ with the app settings; in a Next app the app project also covers app/ and Next's types. */
export function checkTypecheckProjects(root: string): string[] {
  const problems: string[] = [];
  const solution = readTsconfig(root, 'tsconfig.json') as { references?: { path: string }[] };
  if (!solution.references?.some((reference) => reference.path === './tsconfig.scripts.json'))
    problems.push('tsconfig.json does not reference tsconfig.scripts.json');
  const scripts = readTsconfig(root, 'tsconfig.scripts.json') as { extends?: string; include?: string[] };
  if (scripts.extends !== './tsconfig.app.json') problems.push('tsconfig.scripts.json does not extend tsconfig.app.json');
  for (const folder of ['scripts', 'tests'])
    if (!scripts.include?.includes(folder)) problems.push(`tsconfig.scripts.json does not include ${folder}`);
  if (kitTarget(root) === 'next') {
    const app = readTsconfig(root, 'tsconfig.app.json') as { include?: string[] };
    for (const entry of ['src', 'app', 'next-env.d.ts', '.next/types/**/*.ts'])
      if (!app.include?.includes(entry)) problems.push(`tsconfig.app.json does not include ${entry}`);
    if (!/tsconfigPath:\s*'tsconfig\.app\.json'/.test(nextConfig(root)))
      problems.push("next.config does not point typescript.tsconfigPath at 'tsconfig.app.json'");
  }
  return problems;
}

/** pnpm a11y:audit runs the kit's audit: as is in a Vite app, against `next start` (with options) in a Next app. */
export function checkA11yScript(root: string): string[] {
  const script = readPkg(root).scripts?.['a11y:audit'] ?? '';
  const ok = kitTarget(root) === 'next' ? script.startsWith('node scripts/a11y/audit.mjs') : script === 'node scripts/a11y/audit.mjs';
  return ok ? [] : [`a11y:audit is "${script}"`];
}

/** The three approved families load: Google Fonts in a Vite app's index.css, next/font in a Next app's root layout. */
export function checkFontLoading(root: string): string[] {
  if (kitTarget(root) === 'next') {
    // The root layout, or the fonts module it shares with the global 404.
    const layout = `${read(root, NEXT_LAYOUT)}\n${read(root, NEXT_FONTS)}`;
    return [
      ...missing(
        layout,
        ["from 'next/font/google'", 'Schibsted_Grotesk', 'Noto_Kufi_Arabic', 'Spline_Sans_Mono'],
        `${NEXT_LAYOUT} (or ${NEXT_FONTS})`,
      ),
      ...(/DM_Sans|Fraunces|IBM_Plex/.test(layout) ? [`${NEXT_LAYOUT} loads an unapproved family`] : []),
    ];
  }
  const fontImport = read(root, 'src/index.css').split('\n')[0];
  return [
    ...missing(fontImport, ['family=Schibsted+Grotesk', 'family=Noto+Kufi+Arabic', 'family=Spline+Sans+Mono'], "index.css's font import"),
    ...(/DM\+Sans|Fraunces|IBM\+Plex/.test(fontImport) ? ["index.css's font import loads an unapproved family"] : []),
  ];
}
