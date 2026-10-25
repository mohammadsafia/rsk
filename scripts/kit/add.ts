/**
 * Adds ready-made blocks (molecules, organisms, page templates) from the kit to this app, or takes them out.
 *
 *   pnpm kit:add                        # search and pick from the catalogue
 *   pnpm kit:add system-pages search-field
 *   pnpm kit:remove search-field [--force]
 *
 * Options: --from <dir> (a local starter instead of GitHub), --dry-run (add: list what would change), --force (remove:
 * even when you changed the block or another block depends on it).
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { autocompleteMultiselect, isCancel } from '@clack/prompts';

import { kitTarget } from '../lib/kit-target.mjs';

import { type BlockLevel, type BlockMeta, readBlocks, resolveDependencies, writeIndex } from './blocks';
import { dependencyChanges, hashFile, LOCK_FILE, readLock, writeLock } from './core';
import { download, starterRepo } from './download';

/** The blocks a starter offers: `dir` is the starter checkout, with registry/. */
export type Catalogue = { dir: string; blocks: BlockMeta[]; /** The starter's kit version (its kit.lock.json). */ kit?: string };
export type AddResult = { added: string[]; files: string[]; install: string | null };
export type RemoveResult = { removed: string[]; files: string[] };

/** Every file under `root/dir`, as posix paths relative to `root`. */
const walk = (root: string, dir = ''): string[] => {
  const full = path.join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(root, rel) : [rel];
  });
};

export function readCatalogue(starterDir: string): Catalogue {
  const index = path.join(starterDir, 'registry/index.json');
  if (!existsSync(index)) throw new Error('This starter has no block catalogue (registry/index.json): update it, or use a newer one.');
  const lockFile = path.join(starterDir, LOCK_FILE);
  const kit = existsSync(lockFile) ? (JSON.parse(readFileSync(lockFile, 'utf8')) as { kit: string }).kit : undefined;
  return { dir: starterDir, blocks: JSON.parse(readFileSync(index, 'utf8')) as BlockMeta[], kit };
}

/** A block's registry files, as app-relative paths. */
const filesOf = (catalogue: Catalogue, id: string) => walk(path.join(catalogue.dir, 'registry/blocks', id, 'files'));
const source = (catalogue: Catalogue, id: string, file: string) => path.join(catalogue.dir, 'registry/blocks', id, 'files', file);

/**
 * What an app made before blocks still lacks for added blocks to work: the wiring lives in files the app owns, so
 * kit:update can't add it. [] when the app has it. `configDir` holds tsconfig.app.json and src/locales (the app).
 */
/** A Next app's block routes are generated files that arrive with the next kit version: until then, blocks wait. */
const refuseInNext = (appDir: string): void => {
  if (kitTarget(appDir) === 'next') throw new Error('Blocks in a Next app arrive with the next kit version.');
};

export function wiringGaps(appDir: string, configDir = appDir): string[] {
  // A Next app's block routes are generated files (Phase 4), not wiring the app adds by hand.
  if (kitTarget(appDir) === 'next') return [];
  const text = (dir: string, file: string) => (existsSync(path.join(dir, file)) ? readFileSync(path.join(dir, file), 'utf8') : '');
  const router = text(appDir, 'src/routes/router.tsx');
  const routes = text(appDir, 'src/routes/routes.ts');
  const tsconfig = text(configDir, 'tsconfig.app.json');
  const locales = text(configDir, 'src/locales/index.ts');
  return [
    !/appBlockRoutes/.test(router) &&
      'src/routes/router.tsx: spread appBlockRoutes inside the app shell, bareBlockRoutes before the "*" route, and use BlockErrorElement (from "../blocks") as the error element',
    !/blockNav/.test(routes) &&
      'src/routes/routes.ts: append blockNav (from "../blocks") to APP_MENU, and give AppMenu a `labelKey?: string`',
    !tsconfig.includes('"@blocks/*"') && 'tsconfig.app.json: add the path "@blocks/*": ["./src/blocks/*"]',
    !tsconfig.includes('"@locales/*"') && 'tsconfig.app.json: add the path "@locales/*": ["./src/locales/*"]',
    !locales.includes('block-*.json') &&
      "src/locales/index.ts: leave './{en,ar}/block-*.json' out of the eager glob (blocks bring their own copy)",
  ].filter((gap): gap is string => !!gap);
}

/**
 * Adds `ids` and the blocks they depend on: copies their files and locale files, records them in kit.lock.json and
 * regenerates src/blocks/index.ts. Blocks already added are skipped. Nothing is written if any file would overwrite one
 * of the app's own.
 */
export function addBlocks({
  appDir,
  catalogue,
  ids,
  dryRun = false,
}: {
  appDir: string;
  catalogue: Catalogue;
  ids: string[];
  dryRun?: boolean;
}): AddResult {
  refuseInNext(appDir);
  const lock = readLock(appDir);
  // Blocks are built on the kit: one from a newer kit than the app's may use what the app doesn't have yet, and its
  // later updates would merge against the wrong base.
  if (catalogue.kit && catalogue.kit !== lock.kit)
    throw new Error(
      `This app has rsk@${lock.kit.slice(0, 7)} and the starter has rsk@${catalogue.kit.slice(0, 7)}: run pnpm kit:update first, then add blocks.`,
    );
  const have = new Set(lock.blocks ?? []);
  const wanted = resolveDependencies(ids, catalogue.blocks).filter((id) => !have.has(id));
  const files = wanted.flatMap((id) => filesOf(catalogue, id).map((file) => ({ id, file })));
  // Check everything before writing anything: an existing file with other content is the app's, and stays.
  for (const { id, file } of files) {
    const target = path.join(appDir, file);
    if (existsSync(target) && hashFile(target) !== hashFile(source(catalogue, id, file)))
      throw new Error(`${file} already exists in this app with other content; move it away to add "${id}".`);
  }
  const packages: Record<string, string> = Object.assign(
    {},
    ...catalogue.blocks.filter((block) => wanted.includes(block.id)).map((block) => block.packages),
  );
  const appPackage = JSON.parse(readFileSync(path.join(appDir, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  // Only packages the app lacks: a version it already has is the app's choice.
  const missing = Object.fromEntries(
    Object.entries(packages).filter(([name]) => !appPackage.dependencies?.[name] && !appPackage.devDependencies?.[name]),
  );
  const install = dependencyChanges(appPackage, {
    dependencies: { ...appPackage.dependencies, ...missing },
    devDependencies: appPackage.devDependencies,
  });
  const result = { added: wanted, files: files.map(({ file }) => file), install };
  if (dryRun || !wanted.length) return result;

  for (const { id, file } of files) {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    cpSync(source(catalogue, id, file), path.join(appDir, file));
  }
  const lockFiles = new Map(Object.entries(lock.files));
  for (const { file } of files) lockFiles.set(file, hashFile(path.join(appDir, file)));
  const blocks = [...have, ...wanted];
  writeLock(appDir, lock.kit, lockFiles, blocks);
  writeIndex(appDir);
  return result;
}

/**
 * Takes `ids` back out: deletes their files and locale files, drops them from kit.lock.json and regenerates
 * src/blocks/index.ts. Refuses when the app changed one of their files, put its own file in their folder, or another of
 * its blocks depends on one, unless `force`. Needs only the app (no catalogue).
 */
export function removeBlocks({ appDir, ids, force = false }: { appDir: string; ids: string[]; force?: boolean }): RemoveResult {
  refuseInNext(appDir);
  const lock = readLock(appDir);
  const have = lock.blocks ?? [];
  for (const id of ids) if (!have.includes(id)) throw new Error(`"${id}" isn't added to this app.`);
  const remaining = have.filter((id) => !ids.includes(id));
  const owns = (file: string) =>
    ids.some((id) => file.startsWith(`src/blocks/${id}/`) || /^src\/locales\/(en|ar)\/block-(.+)\.json$/.exec(file)?.[2] === id);
  const files = Object.keys(lock.files).filter(owns);
  // Files in the blocks' folders that kit:add didn't put there are the app's own.
  const own = ids.flatMap((id) =>
    walk(appDir, `src/blocks/${id}`)
      .filter((file) => !(file in lock.files))
      .map((file) => ({ id, file })),
  );
  if (!force) {
    for (const { id, file } of own)
      throw new Error(`Can't remove "${id}": ${file} isn't one of "${id}"'s files (yours?). Move it away, or --force to delete it too.`);
    for (const block of readBlocks(appDir).filter((meta) => remaining.includes(meta.id)))
      for (const id of ids)
        if (block.dependsOn.includes(id)) throw new Error(`Can't remove "${id}": "${block.id}" depends on it (--force to remove anyway).`);
    for (const file of files)
      if (existsSync(path.join(appDir, file)) && hashFile(path.join(appDir, file)) !== lock.files[file])
        throw new Error(`Can't remove: you changed ${file} (--force to remove it anyway).`);
  }
  for (const file of files) rmSync(path.join(appDir, file), { force: true });
  // With --force the app's own files go too; otherwise there are none left, and the folders are empty.
  for (const id of ids) rmSync(path.join(appDir, 'src/blocks', id), { recursive: true, force: true });
  writeLock(appDir, lock.kit, new Map(Object.entries(lock.files).filter(([file]) => !files.includes(file))), remaining);
  writeIndex(appDir);
  return { removed: ids, files };
}

type Args = { command: 'add' | 'remove'; ids: string[]; from?: string; dryRun: boolean; force: boolean };

function parseArgs(argv: string[]): Args {
  const [command, ...rest] = argv;
  if (command !== 'add' && command !== 'remove') throw new Error('usage: add.ts add|remove [ids…] [--from dir] [--dry-run] [--force]');
  const args: Args = { command, ids: [], dryRun: false, force: false };
  for (let index = 0; index < rest.length; index += 1) {
    const [flag, inline] = rest[index].split(/=(.*)/s);
    if (!flag.startsWith('--')) args.ids.push(flag);
    else if (flag === '--dry-run') args.dryRun = true;
    else if (flag === '--force') args.force = true;
    else if (flag === '--from') {
      const given = inline ?? rest[index + 1];
      if (!given || given.startsWith('--')) throw new Error('--from needs a value');
      if (inline === undefined) index += 1;
      args.from = given;
    } else throw new Error(`Unknown option ${flag}`);
  }
  return args;
}

const LEVELS: BlockLevel[] = ['molecule', 'organism', 'template'];

/** The catalogue as text, grouped by level, for a terminal that can't show the picker. */
const listing = (catalogue: Catalogue, added: string[]) =>
  LEVELS.map((level) => {
    const blocks = catalogue.blocks.filter((block) => block.level === level);
    const lines = blocks.map((block) => `  ${block.id.padEnd(28)} ${block.description}${added.includes(block.id) ? ' (added)' : ''}`);
    return blocks.length ? `${level}s:\n${lines.join('\n')}` : '';
  })
    .filter(Boolean)
    .join('\n\n');

/** The interactive picker: search by title, id, tags, description, level and family. Null when cancelled. */
/**
 * The catalogue in the order the picker shows it for `search`: a match in a block's name ranks before one in its tags,
 * then its level or family, then only its description; ties keep the catalogue's order.
 */
export function rankBlocks(blocks: BlockMeta[], search: string): BlockMeta[] {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const tier = (block: BlockMeta) => {
    const fields = [`${block.id} ${block.title}`, block.tags.join(' '), `${block.level} ${block.family}`, block.description].map((text) =>
      text.toLowerCase(),
    );
    // A block ranks by its weakest word: every word must match somewhere.
    return Math.max(
      0,
      ...words.map((word) => {
        const found = fields.findIndex((text) => text.includes(word));
        return found < 0 ? fields.length : found;
      }),
    );
  };
  return blocks
    .map((block, index) => ({ block, index, tier: tier(block) }))
    .sort((a, b) => a.tier - b.tier || a.index - b.index)
    .map(({ block }) => block);
}

/** Whether every word of `search` is somewhere in the block's id, title, description, level, family or tags. */
const matches = (search: string, block: BlockMeta) => {
  const text = [block.id, block.title, block.description, block.level, block.family, ...block.tags].join(' ').toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word));
};

async function pick(catalogue: Catalogue, added: string[]): Promise<string[] | null> {
  const byId = new Map(catalogue.blocks.map((block) => [block.id, block]));
  const picked = await autocompleteMultiselect<string>({
    message: 'Which blocks do you want to add?',
    placeholder: 'Search blocks',
    // Re-ranked when the search changes (clack calls this with the prompt), and the focus moves to the best match:
    // clack would otherwise keep it on the option focused before typing.
    options() {
      const ranked = rankBlocks(catalogue.blocks, this.userInput);
      const best = ranked.find((block) => !added.includes(block.id) && matches(this.userInput, block));
      if (this.userInput && best) this.focusedValue = best.id;
      return ranked.map((block) => ({
        value: block.id,
        label: added.includes(block.id) ? `${block.title} (added)` : block.title,
        hint: `${block.level} · ${block.family}`,
        disabled: added.includes(block.id),
      }));
    },
    filter: (search, option) => {
      const block = byId.get(option.value);
      return block ? matches(search, block) : option.value.includes(search);
    },
  });
  return isCancel(picked) ? null : picked;
}

async function main() {
  const { command, ids, from, dryRun, force } = parseArgs(process.argv.slice(2));
  const appDir = process.cwd();
  const added = readLock(appDir).blocks ?? [];
  // Removing needs only the app's own blocks.
  if (command === 'remove') {
    if (!ids.length) throw new Error('usage: pnpm kit:remove <block ids…> [--force]');
    const result = removeBlocks({ appDir, ids, force });
    console.log(`Removed ${result.removed.join(', ')} (${result.files.length} files).`);
    return;
  }

  const starterDir = from ? path.resolve(from) : await download('refs/heads/main');
  if (!starterDir) throw new Error(`${starterRepo()} has no main branch.`);

  try {
    const catalogue = readCatalogue(starterDir);

    let wanted = ids;
    if (!wanted.length) {
      if (!process.stdin.isTTY) {
        console.log(`${listing(catalogue, added)}\n\nName the blocks to add: pnpm kit:add <ids…>`);
        process.exitCode = 1;
        return;
      }
      const picked = await pick(catalogue, added);
      if (!picked?.length) return;
      wanted = picked;
    }

    const result = addBlocks({ appDir, catalogue, ids: wanted, dryRun });
    if (!result.added.length) {
      console.log('Every block you named is already added.');
      return;
    }
    console.log(`${dryRun ? 'Would add' : 'Added'} ${result.added.join(', ')}:\n${result.files.map((file) => `  ${file}`).join('\n')}`);
    if (result.install) console.log(`\nThese blocks need packages this app doesn't have:\n  ${result.install}`);
    const gaps = wiringGaps(appDir);
    if (gaps.length)
      console.log(`\nThis app was made before blocks; for them to show up, it still needs:\n${gaps.map((gap) => `  - ${gap}`).join('\n')}`);
    else if (!dryRun) console.log('\nRun vp dev: template pages are routed from src/blocks/index.ts.');
  } finally {
    if (!from) rmSync(starterDir, { recursive: true, force: true });
  }
}

/** Whether this module is the script Node was asked to run (symlinked checkouts compared as real paths). */
const isEntry = () => {
  try {
    return !!process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
};

if (isEntry()) await main();
