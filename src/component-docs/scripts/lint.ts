import fs from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';
import { z } from 'zod';

const DOCS_ROOT = path.resolve(process.cwd(), 'src/component-docs');

const REQUIRED_FRONTMATTER_KEYS = ['id', 'title', 'section', 'category', 'description'] as const;

const FrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  section: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

const TEMPLATE_PLACEHOLDER_MARKERS = ['component-id', 'Component Name', 'RealComponentName', 'Replace these placeholders'] as const;

function checkDuplicateId(id: string, relativePath: string, firstPathById: Map<string, string>, errors: string[]) {
  const existingPath = firstPathById.get(id);
  if (existingPath) {
    errors.push(`${relativePath} duplicate id "${id}", also used in ${existingPath}`);
  } else {
    firstPathById.set(id, relativePath);
  }
}
function normalizeCategoryKey(raw: string): string {
  return (
    String(raw ?? 'UI')
      .trim()
      .toUpperCase() || 'UI'
  );
}

function isKebabCase(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

async function listMdxFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const mdxFiles: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_')) continue;
      mdxFiles.push(...(await listMdxFiles(entryPath)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.mdx')) mdxFiles.push(entryPath);
  }

  return mdxFiles;
}

function inferFolderCategory(filePath: string): string {
  const rel = path.relative(DOCS_ROOT, filePath);
  const parts = rel.split(path.sep);
  return parts[0] ?? 'ui';
}

function formatRelPath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

function pushMissingRequiredErrors(errors: string[], relativePath: string, frontmatterRaw: Record<string, unknown>): boolean {
  let hasMissing = false;

  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    const value = frontmatterRaw[key];
    if (value == null || value === '') {
      errors.push(`${relativePath} missing required frontmatter field "${key}"`);
      hasMissing = true;
    }
  }

  return hasMissing;
}

function hasTemplatePlaceholders(raw: string): boolean {
  return TEMPLATE_PLACEHOLDER_MARKERS.some((marker) => raw.includes(marker));
}

async function main(): Promise<void> {
  const files = await listMdxFiles(DOCS_ROOT);
  const errors: string[] = [];
  const firstPathById = new Map<string, string>();

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);
    const frontmatterRaw = parsed.data;

    const relativePath = formatRelPath(filePath);

    if (pushMissingRequiredErrors(errors, relativePath, (frontmatterRaw ?? {}) as Record<string, unknown>)) continue;
    const result = FrontmatterSchema.safeParse(frontmatterRaw);
    if (!result.success) {
      errors.push(`${relativePath} invalid frontmatter`);
      continue;
    }

    const frontmatter = result.data;
    const folderCategory = normalizeCategoryKey(inferFolderCategory(filePath));
    const frontmatterCategory = normalizeCategoryKey(frontmatter.category);

    if (!isKebabCase(frontmatter.id)) {
      errors.push(`${relativePath} frontmatter id must be kebab case, got "${frontmatter.id}"`);
    }

    if (frontmatterCategory !== folderCategory) {
      errors.push(`${relativePath} category mismatch, folder is "${folderCategory}" but frontmatter is "${frontmatterCategory}"`);
    }

    checkDuplicateId(frontmatter.id, relativePath, firstPathById, errors);

    if (hasTemplatePlaceholders(raw)) {
      errors.push(`${relativePath} still contains template placeholder text`);
    }
  }

  if (errors.length) {
    console.error('\nComponent docs lint failed\n');
    const uniqueErrors = [...new Set(errors)];
    for (const entry of uniqueErrors) {
      console.error(`• ${entry}`);
    }
    console.error('');
    process.exitCode = 1;
    return;
  }

  console.log('Component docs lint passed');
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
