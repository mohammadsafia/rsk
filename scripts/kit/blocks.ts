// Blocks: ready-made molecules, organisms and page templates an app adds with kit:add. A block lives in
// src/blocks/<id>/ with a block.json; its copy lives in src/locales/{en,ar}/block-<id>.json.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { kitTarget } from '../lib/kit-target.mjs';
import { writeBlockRoutes } from './block-routes';
import { readLock, writeLock } from './core';

export type BlockLevel = 'molecule' | 'organism' | 'template';
export type BlockRoute = {
  path: string;
  component: string;
  layout: 'app' | 'bare';
  /** A key in the block's own locale files: the page's title (a Next app's generated page reads it). */
  titleKey?: string;
};
export type BlockNav = { id: string; path: string; icon: string };
export type BlockMeta = {
  id: string;
  title: string;
  level: BlockLevel;
  family: string;
  description: string;
  tags: string[];
  dependsOn: string[];
  packages: Record<string, string>;
  routes: BlockRoute[];
  nav: BlockNav[];
  /** A component the block exports to show when a route fails to render (a 500 page). */
  errorElement?: string;
};

const LEVELS: BlockLevel[] = ['molecule', 'organism', 'template'];
const LANGS = ['en', 'ar'];

const walk = (root: string, dir: string): string[] =>
  existsSync(path.join(root, dir))
    ? readdirSync(path.join(root, dir)).flatMap((name) => {
        const rel = `${dir}/${name}`;
        return statSync(path.join(root, rel)).isDirectory() ? walk(root, rel) : [rel];
      })
    : [];

/** A block's files, app-relative: its folder and its locale files. */
export function blockFiles(root: string, id: string): string[] {
  return [
    ...walk(root, `src/blocks/${id}`),
    ...LANGS.map((lang) => `src/locales/${lang}/block-${id}.json`).filter((file) => existsSync(path.join(root, file))),
  ].sort((a, b) => a.localeCompare(b));
}

export function readBlocks(root: string): BlockMeta[] {
  const dir = path.join(root, 'src/blocks');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => existsSync(path.join(dir, name, 'block.json')))
    .map((name) => JSON.parse(readFileSync(path.join(dir, name, 'block.json'), 'utf8')) as BlockMeta)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Everything wrong with the catalogue under `root`, one line each; [] when it is valid. */
export function validateBlocks(root: string): string[] {
  const errors: string[] = [];
  const dir = path.join(root, 'src/blocks');
  const folders = existsSync(dir) ? readdirSync(dir).filter((name) => statSync(path.join(dir, name)).isDirectory()) : [];
  const ids = new Set(folders);
  for (const folder of folders) {
    const file = path.join(dir, folder, 'block.json');
    if (!existsSync(file)) {
      errors.push(`${folder}: missing block.json`);
      continue;
    }
    const block = JSON.parse(readFileSync(file, 'utf8')) as BlockMeta;
    if (block.id !== folder) errors.push(`${folder}: id "${block.id}" must match its folder`);
    if (!LEVELS.includes(block.level)) errors.push(`${folder}: level must be molecule, organism or template`);
    for (const key of ['title', 'family', 'description'] as const) if (!block[key]) errors.push(`${folder}: missing ${key}`);
    for (const lang of LANGS)
      if (!existsSync(path.join(root, `src/locales/${lang}/block-${folder}.json`)))
        errors.push(`${folder}: missing src/locales/${lang}/block-${folder}.json`);
    for (const dependency of block.dependsOn ?? [])
      if (!ids.has(dependency)) errors.push(`${folder}: depends on unknown block "${dependency}"`);
    const indexFile = path.join(dir, folder, 'index.ts');
    const exported = existsSync(indexFile) ? readFileSync(indexFile, 'utf8') : '';
    const exports = (name: string) =>
      new RegExp(`export\\s+(?:const|function|default\\s+function)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`).test(exported);
    for (const route of block.routes ?? [])
      if (route.layout !== 'app' && route.layout !== 'bare')
        errors.push(`${folder}: route ${route.path} has layout "${String(route.layout as unknown)}"; use "app" or "bare"`);
    for (const route of block.routes ?? [])
      if (!exports(route.component))
        errors.push(`${folder}: route ${route.path} names "${route.component}", which src/blocks/${folder}/index.ts doesn't export`);
    for (const route of block.routes ?? []) {
      if (!route.titleKey) continue;
      for (const lang of LANGS) {
        const localeFile = `src/locales/${lang}/block-${folder}.json`;
        const copy: unknown = existsSync(path.join(root, localeFile)) ? JSON.parse(readFileSync(path.join(root, localeFile), 'utf8')) : {};
        const value = route.titleKey.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], copy);
        if (typeof value !== 'string')
          errors.push(`${folder}: route ${route.path} has titleKey "${route.titleKey}", missing in ${localeFile}`);
      }
    }
    if (block.errorElement && !exports(block.errorElement))
      errors.push(`${folder}: errorElement "${block.errorElement}" isn't exported by src/blocks/${folder}/index.ts`);
    // The menu shows a block's entries by `nav.<id>` in its own locale files.
    for (const lang of LANGS) {
      const localeFile = path.join(root, `src/locales/${lang}/block-${folder}.json`);
      const nav = existsSync(localeFile)
        ? (JSON.parse(readFileSync(localeFile, 'utf8')) as { nav?: Record<string, unknown> }).nav
        : undefined;
      for (const item of block.nav ?? [])
        if (typeof nav?.[item.id] !== 'string')
          errors.push(`${folder}: menu entry "${item.id}" has no nav.${item.id} in src/locales/${lang}/block-${folder}.json`);
    }
  }

  // Across the catalogue: dependencies resolve without a cycle, and only one block may own the catch-all or the error
  // page (the generated index would silently take the first).
  const blocks = readBlocks(root);
  try {
    resolveDependencies(
      blocks.map((block) => block.id),
      blocks.map((block) => ({ ...block, dependsOn: (block.dependsOn ?? []).filter((id) => ids.has(id)) })),
    );
  } catch (error) {
    errors.push((error as Error).message);
  }
  const catchAll = blocks.filter((block) => block.routes?.some((route) => route.path === '*')).map((block) => block.id);
  if (catchAll.length > 1) errors.push(`more than one block routes "*": ${catchAll.join(', ')}`);
  const errorPages = blocks.filter((block) => block.errorElement).map((block) => block.id);
  if (errorPages.length > 1) errors.push(`more than one block has an errorElement: ${errorPages.join(', ')}`);
  return errors;
}

/** `ids` plus everything they depend on, dependencies first, each once. */
export function resolveDependencies(ids: string[], catalogue: BlockMeta[]): string[] {
  const byId = new Map(catalogue.map((block) => [block.id, block]));
  const ordered: string[] = [];
  const visit = (id: string, trail: string[]) => {
    if (trail.includes(id)) throw new Error(`Blocks depend on each other in a cycle: ${[...trail, id].join(' → ')}`);
    if (ordered.includes(id)) return;
    const block = byId.get(id);
    if (!block) throw new Error(`Unknown block "${id}". Run kit:add without an id to search the catalogue.`);
    for (const dependency of block.dependsOn) visit(dependency, [...trail, id]);
    ordered.push(id);
  };
  for (const id of ids) visit(id, []);
  return ordered;
}

const route = (blockId: string, entry: BlockRoute) =>
  `{ path: '${entry.path}', lazy: async () => ({ Component: (await import('./${blockId}')).${entry.component} }) }`;

/** vite.config.ts fmt.printWidth: the generated index must pass `vp check` as written. */
const PRINT_WIDTH = 140;

/** `head = [entries];` laid out as the formatter would: one entry on one line if it fits, otherwise one per line. */
const declareList = (head: string, entries: string[]) => {
  const inline = `${head} = [${entries.join(', ')}];`;
  if (entries.length <= 1 && inline.length <= PRINT_WIDTH) return inline;
  return `${head} = [\n${entries.map((entry) => `  ${entry},`).join('\n')}\n];`;
};

/** The source of src/blocks/index.ts: the added blocks' routes, menu entries and error page. Written by kit:add/kit:remove. */
/** Vite: React Router's error hooks feed the error block's page, which loads only when a route fails. */
const viteErrorElement = (block: BlockMeta): string[] => [
  `const ErrorPage = lazy(async () => ({ default: (await import('./${block.id}')).${block.errorElement} }));`,
  '',
  "/** The router's error element: the block's error page, fed from React Router. Loads only when a route fails. */",
  'export function BlockErrorElement(): ReactElement {',
  '  const error = useRouteError();',
  '  const revalidator = useRevalidator();',
  '  return createElement(ErrorPage, {',
  '    error,',
  '    notFound: isRouteErrorResponse(error) && error.status === 404,',
  "    retrying: revalidator.state === 'loading',",
  '    retry: () => void revalidator.revalidate(),',
  '  });',
  '}',
];

/** The menu entries of the added blocks, and how their labels are imported (only `nav` from each locale file). */
const menuOf = (blocks: BlockMeta[]) => {
  const nav = blocks.flatMap((block) => block.nav.map((item) => ({ block, item })));
  const labelled = blocks.filter((block) => block.nav.length);
  const navIdentifier = (id: string, lang: string) =>
    `${`block-${id}`.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())}Nav${lang === 'en' ? 'En' : 'Ar'}`;
  return {
    labelled,
    navIdentifier,
    icons: [...new Set(nav.map(({ item }) => item.icon))].sort((a, b) => a.localeCompare(b)),
    navImports: labelled.flatMap((block) =>
      LANGS.map((lang) => `import { nav as ${navIdentifier(block.id, lang)} } from '@locales/${lang}/block-${block.id}.json';`),
    ),
    navList: declareList(
      'export const blockNav: AppMenu[]',
      nav.map(
        ({ block, item }) => `{ id: '${item.id}', path: '${item.path}', icon: ${item.icon}, labelKey: 'block-${block.id}:nav.${item.id}' }`,
      ),
    ),
  };
};

/**
 * A Next app's index: the menu entries and their labels only. Next generates the blocks' pages under app/
 * (block-routes.ts), and a server renders each request with its own i18n instance, so nothing is registered at import:
 * the [lang] layout adds `blockNavLabels` to the page's translations.
 */
const nextBlockIndex = (blocks: BlockMeta[]): string => {
  const { labelled, navIdentifier, icons, navImports, navList } = menuOf(blocks);
  const labels = (lang: string) =>
    `{ ${labelled.map((block) => `'block-${block.id}': { nav: ${navIdentifier(block.id, lang)} }`).join(', ')} }`.replace('{  }', '{}');
  const head = "export const blockNavLabels: Record<'en' | 'ar', ResourceLanguage> =";
  const inline = `${head} { ${LANGS.map((lang) => `${lang}: ${labels(lang)}`).join(', ')} };`;
  return [
    "// Generated by kit:add / kit:remove from the added blocks' block.json. Do not edit by hand.",
    "import type { ResourceLanguage } from 'i18next';",
    ...(icons.length ? [`import { ${icons.join(', ')} } from 'lucide-react';`] : []),
    '',
    ...(navImports.length ? [...navImports, ''] : []),
    "import type { AppMenu } from '@routes';",
    '',
    "/** The menu's entries for the added blocks' pages (their files are generated under app/). */",
    navList,
    '',
    "/** Their labels, by language: the [lang] layout adds them to the page's translations, so the menu has them on every page. */",
    labelled.length ? `${head} {\n${LANGS.map((lang) => `  ${lang}: ${labels(lang)},`).join('\n')}\n};` : inline,
    '',
  ].join('\n');
};

export function generateBlockIndex(blocks: BlockMeta[], target: 'vite' | 'next' = 'vite'): string {
  if (target === 'next') return nextBlockIndex(blocks);
  const routes = (layout: 'app' | 'bare') =>
    blocks
      .flatMap((block) => block.routes.filter((entry) => entry.layout === layout).map((entry) => ({ block, entry })))
      // A catch-all matches last, so it never hides a more specific route.
      .sort((a, b) => Number(a.entry.path === '*') - Number(b.entry.path === '*'))
      .map(({ block, entry }) => route(block.id, entry));
  const errorBlock = blocks.find((block) => block.errorElement);
  // The menu lists blocks' pages on every page, before any block loads: their labels (only `nav`) come with the index.
  const { labelled, navIdentifier, icons, navImports, navList } = menuOf(blocks);
  const navBundles = labelled.flatMap((block) =>
    LANGS.map((lang) => `i18n.addResourceBundle('${lang}', 'block-${block.id}', { nav: ${navIdentifier(block.id, lang)} }, true);`),
  );
  return [
    "// Generated by kit:add / kit:remove from the added blocks' block.json. Do not edit by hand.",
    errorBlock ? "import { createElement, lazy, type ReactElement } from 'react';" : "import type { ReactElement } from 'react';",
    "import type { RouteObject } from 'react-router';",
    ...(errorBlock ? ["import { isRouteErrorResponse, useRevalidator, useRouteError } from 'react-router';"] : []),
    ...(labelled.length ? ["import i18n from 'i18next';"] : []),
    ...(icons.length ? [`import { ${icons.join(', ')} } from 'lucide-react';`] : []),
    '',
    ...(navImports.length ? [...navImports, ''] : []),
    "import type { AppMenu } from '@routes';",
    '',
    ...(navBundles.length
      ? ['// Menu labels: the sidebar and the command palette show them before any block page loads.', ...navBundles, '']
      : []),
    '/** Pages inside the app shell (sidebar, header). */',
    declareList('export const appBlockRoutes: RouteObject[]', routes('app')),
    '',
    "/** Pages on their own (no shell): placed before the app's catch-all, so a block's 404 replaces it. */",
    declareList('export const bareBlockRoutes: RouteObject[]', routes('bare')),
    '',
    // The error page loads when a route fails, so it never weighs on the first load of the pages that don't.
    ...(errorBlock ? viteErrorElement(errorBlock) : ['export const BlockErrorElement: (() => ReactElement) | null = null;']),
    '',
    navList,
    '',
  ].join('\n');
}

/**
 * Regenerates src/blocks/index.ts from the app's own blocks (their block.json), whatever the catalogue has now; in a
 * Next app also their App Router files, recorded in the lock. Returns the generated files kept because the app changed
 * them.
 */
export function writeIndex(appDir: string): string[] {
  const target = kitTarget(appDir);
  const blocks = readBlocks(appDir);
  mkdirSync(path.join(appDir, 'src/blocks'), { recursive: true });
  writeFileSync(path.join(appDir, 'src/blocks/index.ts'), generateBlockIndex(blocks, target));
  if (target !== 'next') return [];
  const { generated, kept } = writeBlockRoutes(appDir, blocks);
  const lock = readLock(appDir);
  writeLock(appDir, lock.kit, new Map(Object.entries(lock.files)), lock.blocks ?? [], { generated });
  return kept;
}
