import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { cancel, confirm, intro, isCancel, outro, select, text } from '@clack/prompts';

const DOCS_ROOT_DIR = path.resolve(process.cwd(), 'src/component-docs');
const TEMPLATE_FILE_PATH = path.join(DOCS_ROOT_DIR, '_template', 'component.mdx.tpl');

type SelectOption<T extends string> = Readonly<{
  value: T;
  label: T;
}>;

function toKebabCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');
}

function capitalize(word: string): string {
  return word ? word[0].toUpperCase() + word.slice(1) : '';
}

function toTitleCaseFromKebab(input: string): string {
  return toKebabCase(input).split('-').filter(Boolean).map(capitalize).join(' ');
}

function toPascalCaseFromKebab(input: string): string {
  return toKebabCase(input).split('-').filter(Boolean).map(capitalize).join('');
}

async function readCategoryFolderNames(): Promise<string[]> {
  const entries = await fs.readdir(DOCS_ROOT_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((folderName) => !folderName.startsWith('_') && folderName !== 'scripts')
    .sort((left, right) => left.localeCompare(right));
}

function normalizeCategoryKey(folder: string): string {
  return folder.trim().toUpperCase();
}

function importPathForCategoryFolder(folderName: string): string {
  return `@components/${folderName}`;
}

function renderTemplate(template: string, vars: Readonly<Record<string, string>>): string {
  return template.replaceAll(/{{(\w+)}}/g, (_match: string, key: string) => vars[key] ?? '');
}

function spawnOk(command: string, args: string[]): boolean {
  const res = spawnSync(command, args, { stdio: 'ignore' });
  return !res.error && res.status === 0;
}

function resolveWebStormCommands(): string[] {
  const home = process.env.HOME ?? '';
  const platform = process.platform;

  if (platform === 'darwin') {
    return ['webstorm', '/usr/local/bin/webstorm', '/Applications/WebStorm.app/Contents/MacOS/webstorm'];
  }

  if (platform === 'win32') {
    return ['webstorm', 'webstorm.cmd', 'webstorm.exe'];
  }

  return [
    'webstorm',
    '/usr/local/bin/webstorm',
    '/usr/bin/webstorm',
    home ? `${home}/.local/share/JetBrains/Toolbox/scripts/webstorm` : '',
  ].filter(Boolean);
}

function openFileInEditor(filePath: string): boolean {
  for (const cmd of resolveWebStormCommands()) {
    if (spawnOk(cmd, [filePath])) return true;
  }

  if (spawnOk('code', ['--reuse-window', filePath])) return true;

  if (spawnOk('xdg-open', [filePath])) return true;
  return spawnOk('open', [filePath]);
}

function parseCommaSeparatedTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatTagsForFrontmatter(tags: string[]): string {
  return tags.map((t) => t.replaceAll('"', String.raw`\"`)).join(', ');
}

async function loadTemplate(): Promise<string> {
  return fs.readFile(TEMPLATE_FILE_PATH, 'utf8');
}

type ExistingDocHit = Readonly<{
  id: string;
  filePath: string;
}>;

async function listMdxFilesRecursively(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue;
      if (entry.name === 'scripts') continue;

      out.push(...(await listMdxFilesRecursively(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.mdx')) out.push(entryPath);
  }

  return out;
}

function extractFrontmatterId(fileContent: string): string | null {
  const start = fileContent.indexOf('---');
  if (start !== 0) return null;

  const end = fileContent.indexOf('\n---', 3);
  if (end === -1) return null;

  const fm = fileContent.slice(3, end);
  const idRegex = /^\s*id\s*:\s*(.+)\s*$/m;
  const match = idRegex.exec(fm);
  if (!match) return null;

  const raw = match[1]?.trim() ?? '';
  if (!raw) return null;

  const unquoted = raw.replaceAll(/^(["'])|(["'])$/g, '').trim();
  return unquoted || null;
}

async function findExistingDocById(targetId: string): Promise<ExistingDocHit | null> {
  const files = await listMdxFilesRecursively(DOCS_ROOT_DIR);

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');

    const fmId = extractFrontmatterId(raw);
    const idFromFileName = path.basename(filePath).replace(/\.mdx$/, '');
    const effectiveId = fmId ?? idFromFileName;

    if (effectiveId === targetId) return { id: targetId, filePath };
  }

  return null;
}

async function main(): Promise<void> {
  intro('Create MDX component doc');

  const folderNames = await readCategoryFolderNames();

  if (folderNames.length === 0) {
    cancel('No category folders found under src/component-docs');
    process.exitCode = 1;
    return;
  }

  const folderOptions: Array<SelectOption<string>> = folderNames.map((name) => ({ value: name, label: name }));

  const folder = await select({
    message: 'Pick a category folder',
    options: folderOptions,
  });
  if (isCancel(folder)) {
    cancel('Cancelled');
    return;
  }

  const rawId = await text({
    message: 'Component id (kebab case)',
    placeholder: 'toggle-group',
    validate(value: string) {
      const next = toKebabCase(value);
      if (!next) return 'Id is required';
      if (next !== value.trim()) return `Use: ${next}`;
      return undefined;
    },
  });
  if (isCancel(rawId)) {
    cancel('Cancelled');
    return;
  }

  const id = toKebabCase(String(rawId));
  const title = toTitleCaseFromKebab(id);

  const rawDescription = await text({
    message: 'One sentence description',
    placeholder: 'One sentence describing what this component is for.',
    validate(value: string) {
      if (!value.trim()) return 'Description is required';
      return undefined;
    },
  });
  if (isCancel(rawDescription)) {
    cancel('Cancelled');
    return;
  }

  const rawExtraTags = await text({
    message: 'Extra tags (comma separated)',
    placeholder: 'actions, buttons',
  });
  if (isCancel(rawExtraTags)) {
    cancel('Cancelled');
    return;
  }

  const folderName = String(folder);
  const categoryKey = normalizeCategoryKey(folderName);

  const folderLower = folderName.toLowerCase();
  const idTag = id;

  const derivedFromId = id.split('-').filter(Boolean);
  const extraTags = parseCommaSeparatedTags(String(rawExtraTags));

  const tags = Array.from(new Set([folderLower, idTag, ...derivedFromId, ...extraTags].filter((t): t is string => Boolean(t?.trim()))));

  const tagsInline = formatTagsForFrontmatter(tags);

  const importPath = importPathForCategoryFolder(folderName);
  const componentName = toPascalCaseFromKebab(id);

  const fileName = `${toPascalCaseFromKebab(id)}.mdx`;
  const outFilePath = path.join(DOCS_ROOT_DIR, folderName, fileName);
  const existing = await findExistingDocById(id);
  if (existing) {
    cancel(`Duplicate id "${id}" already exists in: ${path.relative(process.cwd(), existing.filePath)}`);
    process.exitCode = 1;
    return;
  }

  const template = await loadTemplate();
  const content = renderTemplate(template, {
    id,
    title,
    category: categoryKey,
    description: String(rawDescription).trim(),
    tagsInline,
    importPath,
    componentName,
  });

  const ok = await confirm({
    message: `Create ${path.relative(process.cwd(), outFilePath)}?`,
    initialValue: true,
  });
  if (isCancel(ok) || !ok) {
    cancel('Cancelled');
    return;
  }

  await fs.writeFile(outFilePath, content, 'utf8');

  const opened = openFileInEditor(outFilePath);
  const outRelPath = path.relative(process.cwd(), outFilePath);

  outro(opened ? `Created and opened ${outRelPath}` : `Created ${outRelPath}`);

  if (!opened) {
    console.log(`Open it manually: ${outRelPath}`);
  }
}

await main();
