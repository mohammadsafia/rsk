/**
 * Writes a clean app starter from this repository: the UI kit, app shell and tooling, without the component docs,
 * the docs site, the example pages or this repo's plans. `vp create github:<owner>/<repo>` (or an @org/create
 * template) can then scaffold new apps from the result.
 *
 *   pnpm starter:build [outDir]      (default: .starter)
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { lockfileArgs } from './install';
import { DOCS_ONLY_DEV_DEPENDENCIES, DOCS_ONLY_SCRIPTS, DROP, SHOWCASE_NAV_KEYS } from './manifest';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OVERLAY = path.join(ROOT, 'scripts/starter/overlay');

/** Replaces `find` with `replace` and fails if `find` is missing, so a drifted config never goes unnoticed. */
const edit = (file: string, find: string | RegExp, replace: string, out: string) => {
  const full = path.join(out, file);
  const source = readFileSync(full, 'utf8');
  const next = source.replace(find, replace);
  if (next === source)
    throw new Error(`starter: "${String(find).slice(0, 60)}" not found in ${file} — update scripts/starter/build-starter.ts`);
  writeFileSync(full, next);
};

export function buildStarter(outDir: string) {
  const out = path.resolve(ROOT, outDir);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  // 1. Tracked files, minus the showcase.
  const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const kept = files.filter((file) => !DROP.some((prefix) => file === prefix || file.startsWith(prefix)));
  for (const file of kept) {
    if (!existsSync(path.join(ROOT, file))) continue;
    mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
    cpSync(path.join(ROOT, file), path.join(out, file));
  }

  // 2. Maintained replacements (router, menu, starter dashboard, README).
  cpSync(OVERLAY, out, { recursive: true });

  // 3. Config without the docs site.
  for (const line of [
    /^import type \{ Plugin as VitePlugin \} from 'vite-plus';\n/m,
    /^import mdx from '@mdx-js\/rollup';\n/m,
    /^import remarkFrontmatter from 'remark-frontmatter';\n/m,
    /^import remarkMdxFrontmatter from 'remark-mdx-frontmatter';\n/m,
    /^import rehypePrettyCode from 'rehype-pretty-code';\n/m,
    /^import remarkGfm from 'remark-gfm';\n/m,
    /^import remarkDocs from '\.\/scripts\/docs\/remark-docs';\n/m,
    /^import \{ scanDocCounts \} from '\.\/scripts\/docs\/doc-counts';\n/m,
  ]) {
    edit('vite.config.ts', line, '', out);
  }
  // The MDX plugin and its ?raw wrapper: from `const mdxBase` to the wrapper's closing `} as VitePlugin;`.
  edit('vite.config.ts', /const mdxBase = mdx\([\s\S]*?\n\} as VitePlugin;\n\n/, '', out);
  edit('vite.config.ts', 'lazyPlugins(() => [mdxPlugin, react(), ', 'lazyPlugins(() => [react(), ', out);
  edit('vite.config.ts', /\n {2}\/\/ The docs site is dev-only;[^\n]*\n {2}define: \{\n[^\n]*\n {2}\},/, '', out);
  edit('vite.config.ts', /\n {6}\{ find: '@component-docs'[^\n]*/, '', out);
  // Formatter ignores that only this repo needs (docs MDX, vendored agent skills).
  edit('vite.config.ts', /\n {4}\/\/ \*\.mdx:[^\n]*/, '', out);
  edit('vite.config.ts', /\n {4}\/\/ \.claude\/skills:[^\n]*/, '', out);
  edit('vite.config.ts', "ignorePatterns: ['**/*.hbs', '**/*.mdx', '.claude/skills/**']", "ignorePatterns: ['**/*.hbs']", out);
  edit('tsconfig.app.json', /,?\n\s*"@component-docs": \[[^\]]*\]/, '', out);
  edit('tsconfig.app.json', /,?\n\s*"@component-docs\/\*": \[[^\]]*\]/, '', out);

  // This repo excludes its own generated starter from tests and lint; the starter has no such folder.
  edit(
    'vite.config.ts',
    /\n {4}\/\/ `pnpm starter:build`[^\n]*\n {4}exclude: \[\.\.\.configDefaults\.exclude, '\.starter\/\*\*', 'scripts\/starter\/overlay\/\*\*'\],/,
    '',
    out,
  );
  edit(
    'vite.config.ts',
    "import { configDefaults, defineConfig, lazyPlugins } from 'vite-plus';",
    "import { defineConfig, lazyPlugins } from 'vite-plus';",
    out,
  );
  edit('vite.config.ts', "ignorePatterns: ['dist', '.starter', 'scripts/starter/overlay', ", "ignorePatterns: ['dist', ", out);

  // Removing blocks leaves runs of blank lines; keep the file formatter-clean.
  const viteConfig = path.join(out, 'vite.config.ts');
  writeFileSync(viteConfig, readFileSync(viteConfig, 'utf8').replace(/\n{3,}/g, '\n\n'));

  // The DTO generator's sample sources point at a client's API; the starter names a placeholder.
  edit('scripts/cli/config/defaults.ts', /https:\/\/dev-api\.qlinica\.app\/med-legal/g, 'https://api.example.com', out);
  edit('scripts/cli/README.md', /https:\/\/dev-api\.qlinica\.app\/med-legal/g, 'https://api.example.com', out);

  // An app keeps its real settings in .env (this repo tracks an empty one instead).
  const gitignore = path.join(out, '.gitignore');
  writeFileSync(
    gitignore,
    `${readFileSync(gitignore, 'utf8').trimEnd()}\n\n# Local settings: copy .env.example to .env\n.env\n!.env.example\n`,
  );

  // Menu labels of the showcase pages; the starter's menu is Dashboard and Settings.
  for (const locale of ['en', 'ar']) {
    const navFile = path.join(out, `src/locales/${locale}/nav.json`);
    const nav = JSON.parse(readFileSync(navFile, 'utf8')) as Record<string, unknown>;
    for (const key of SHOWCASE_NAV_KEYS) {
      if (!(key in nav)) throw new Error(`starter: nav key "${key}" missing in ${locale}/nav.json — update scripts/starter/manifest.ts`);
      delete nav[key];
    }
    writeFileSync(navFile, `${JSON.stringify(nav, null, 2)}\n`);
  }

  // 4. package.json for a new app.
  const pkgFile = path.join(out, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as Record<string, unknown> & {
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  pkg.name = 'rsk-app';
  pkg.version = '0.1.0';
  pkg.description = 'A React + TypeScript app on Vite+, started from the RSK UI kit.';
  delete pkg.Author;
  for (const script of DOCS_ONLY_SCRIPTS) delete pkg.scripts[script];
  for (const dependency of DOCS_ONLY_DEV_DEPENDENCIES) delete pkg.devDependencies[dependency];
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);

  // 5. Environment template: the keys, never this repo's values.
  const env = readFileSync(path.join(ROOT, '.env'), 'utf8').replace(/^﻿/, '');
  writeFileSync(path.join(out, '.env.example'), env.replace(/^([A-Z0-9_]+)=.*$/gm, '$1='));

  return out;
}

/** Rewrites the starter's pnpm-lock.yaml for its trimmed package.json, so apps can install with a frozen lockfile. */
export function refreshLockfile(out: string) {
  execFileSync('corepack', ['pnpm@10.34.7', ...lockfileArgs()], { cwd: out, stdio: 'inherit' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildStarter(process.argv[2] ?? '.starter');
  refreshLockfile(out);
  console.log(`Starter written to ${out}`);
}
