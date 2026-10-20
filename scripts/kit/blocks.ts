// Blocks: ready-made molecules, organisms and page templates an app adds with kit:add. A block lives in
// src/blocks/<id>/ with a block.json; its copy lives in src/locales/{en,ar}/block-<id>.json.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export type BlockLevel = 'molecule' | 'organism' | 'template';
export type BlockRoute = { path: string; component: string; layout: 'app' | 'bare' };
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
  ].sort();
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
      if (!exports(route.component))
        errors.push(`${folder}: route ${route.path} names "${route.component}", which src/blocks/${folder}/index.ts doesn't export`);
    if (block.errorElement && !exports(block.errorElement))
      errors.push(`${folder}: errorElement "${block.errorElement}" isn't exported by src/blocks/${folder}/index.ts`);
  }
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
  `  { path: '${entry.path}', lazy: async () => ({ Component: (await import('./${blockId}')).${entry.component} }) },`;

/** The source of src/blocks/index.ts: the added blocks' routes, menu entries and error page. Written by kit:add/kit:remove. */
export function generateBlockIndex(blocks: BlockMeta[]): string {
  const routes = (layout: 'app' | 'bare') =>
    blocks
      .flatMap((block) => block.routes.filter((entry) => entry.layout === layout).map((entry) => ({ block, entry })))
      // A catch-all matches last, so it never hides a more specific route.
      .sort((a, b) => Number(a.entry.path === '*') - Number(b.entry.path === '*'))
      .map(({ block, entry }) => route(block.id, entry));
  const nav = blocks.flatMap((block) => block.nav.map((item) => ({ block, item })));
  const icons = [...new Set(nav.map(({ item }) => item.icon))].sort();
  const errorBlock = blocks.find((block) => block.errorElement);
  const list = (lines: string[]) => (lines.length ? `[\n${lines.join('\n')}\n]` : '[]');
  return [
    "// Generated by kit:add / kit:remove from the added blocks' block.json. Do not edit by hand.",
    errorBlock
      ? "import { type ComponentType, lazy, type LazyExoticComponent } from 'react';"
      : "import type { ComponentType, LazyExoticComponent } from 'react';",
    "import type { RouteObject } from 'react-router';",
    ...(icons.length ? [`import { ${icons.join(', ')} } from 'lucide-react';`] : []),
    '',
    "import type { AppMenu } from '@routes';",
    '',
    '/** Pages inside the app shell (sidebar, header). */',
    `export const appBlockRoutes: RouteObject[] = ${list(routes('app'))};`,
    '',
    "/** Pages on their own (no shell): placed before the app's catch-all, so a block's 404 replaces it. */",
    `export const bareBlockRoutes: RouteObject[] = ${list(routes('bare'))};`,
    '',
    // The error page loads when a route fails, so it never weighs on the first load of the pages that don't.
    'export const BlockErrorElement: LazyExoticComponent<ComponentType> | null = ' +
      (errorBlock ? `lazy(async () => ({\n  default: (await import('./${errorBlock.id}')).${errorBlock.errorElement},\n}));` : 'null;'),
    '',
    `export const blockNav: AppMenu[] = ${list(nav.map(({ block, item }) => `  { id: '${item.id}', path: '${item.path}', icon: ${item.icon}, labelKey: 'block-${block.id}:nav.${item.id}' },`))};`,
    '',
  ].join('\n');
}
