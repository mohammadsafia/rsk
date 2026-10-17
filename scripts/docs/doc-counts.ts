/**
 * doc-counts — the landing page's component counts, computed at config time from MDX frontmatter.
 * The docs registry is dev-only (its eager globs compile to static imports of every MDX page), so
 * production reads these numbers from the `__RSK_DOC_COUNTS__` define instead. Mirrors the registry:
 * `_folder` tooling is skipped and the category falls back to the top-level folder.
 */
import fs from 'node:fs';
import path from 'node:path';

export type DocCounts = { ui: number; forms: number; shared: number; total: number };

const normalize = (raw: string | undefined) => (raw ?? 'UI').trim().toUpperCase() || 'UI';

export const countDocs = (entries: ReadonlyArray<{ category: string }>): DocCounts => {
  const counts: DocCounts = { ui: 0, forms: 0, shared: 0, total: entries.length };

  for (const { category } of entries) {
    const key = normalize(category);
    if (key === 'UI') counts.ui += 1;
    else if (key === 'FORMS') counts.forms += 1;
    else if (key === 'SHARED') counts.shared += 1;
  }

  return counts;
};

const categoryOf = (source: string, folder: string) => {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? '';
  return /^category:\s*['"]?([^'"\r\n]+?)['"]?\s*$/m.exec(frontmatter)?.[1] ?? folder;
};

export function scanDocCounts(docsRoot: string): DocCounts {
  const entries = fs
    .readdirSync(docsRoot, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.split(path.sep))
    .filter((parts) => !parts.slice(0, -1).some((part) => part.startsWith('_')))
    .map((parts) => ({ category: categoryOf(fs.readFileSync(path.join(docsRoot, ...parts), 'utf8'), parts[0] ?? 'UI') }));

  return countDocs(entries);
}
