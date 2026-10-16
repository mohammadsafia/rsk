import type { ComponentDocEntry, DocHeading, Frontmatter, MdxModule } from './types';

export { type DocComponent, type ComponentDocEntry, type DocHeading } from './types';

const REQUIRED_FRONTMATTER_KEYS = ['id', 'title', 'section', 'category', 'description'] as const;

export const componentDocsErrors: string[] = [];

export function normalizeCategoryKey(raw: string | undefined | null): string {
  return (
    String(raw ?? 'UI')
      .trim()
      .toUpperCase() || 'UI'
  );
}

let mdxFrontmatter: Record<string, Frontmatter> | undefined;
let mdxLazy: Record<string, () => Promise<MdxModule>> | undefined;
let mdxHeadings: Record<string, DocHeading[]> | undefined;

function getMdxGlobs() {
  mdxFrontmatter ??= import.meta.glob<Frontmatter>('../**/*.mdx', { eager: true, import: 'frontmatter' }) as Record<string, Frontmatter>;
  mdxLazy ??= import.meta.glob<MdxModule>('../**/*.mdx') as Record<string, () => Promise<MdxModule>>;
  mdxHeadings ??= import.meta.glob<DocHeading[]>('../**/*.mdx', { eager: true, import: 'headings' }) as Record<string, DocHeading[]>;
  return { mdxFrontmatter, mdxLazy, mdxHeadings };
}

function inferCategoryFromPath(path: string) {
  const parts = path.split('/');
  return parts[1] ?? 'UI';
}

function validateFrontmatter(path: string, id: string, fm: Frontmatter): string | null {
  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    if (!fm[key]) return `${path} ("${id}") is missing required frontmatter field: ${key}`;
  }
  return null;
}

function createLoader(path: string) {
  const { mdxLazy } = getMdxGlobs();
  const importer = mdxLazy[path];

  return async () => {
    if (!importer) throw new Error(`Missing lazy importer for ${path}`);
    const loaded = await importer();
    return { default: loaded.default };
  };
}

function buildRegistry(): ReadonlyArray<ComponentDocEntry> {
  componentDocsErrors.length = 0;

  const { mdxFrontmatter, mdxHeadings } = getMdxGlobs();
  const registry = Object.keys(mdxFrontmatter)
    // The docs:new template lives next to the docs but is not one.
    // Underscore folders (_template, _fixtures) hold tooling, not docs.
    .filter((path) => !/\/_[^/]+\//.test(path))
    .map((path) => {
      const fm: Frontmatter = mdxFrontmatter[path] ?? {};

      const idFromPath =
        path
          .split('/')
          .pop()
          ?.replace(/\.mdx$/, '') ?? path;
      const id = fm.id ?? idFromPath;

      const error = validateFrontmatter(path, id, fm);
      if (error) componentDocsErrors.push(`[MDX Docs] ${error}`);

      const folderCategory = inferCategoryFromPath(path);
      const normalizedFolderCategory = normalizeCategoryKey(folderCategory);
      const normalizedFrontmatterCategory = fm.category ? normalizeCategoryKey(fm.category) : null;
      const resolvedCategory = normalizedFrontmatterCategory ?? normalizedFolderCategory;

      if (!folderCategory.startsWith('_') && normalizedFrontmatterCategory && normalizedFrontmatterCategory !== normalizedFolderCategory) {
        componentDocsErrors.push(
          `[MDX Docs] ${path} ("${id}") category mismatch. Folder is "${normalizedFolderCategory}" but frontmatter is "${normalizedFrontmatterCategory}".`,
        );
      }

      return Object.freeze({
        id,
        title: fm.title ?? id,
        section: fm.section ?? 'Components',
        category: resolvedCategory,
        description: fm.description ?? '',
        tags: fm.tags ? [...fm.tags] : undefined,
        order: fm.order,
        importFrom: fm.importFrom,
        headings: mdxHeadings[path] ?? [],
        load: createLoader(path),
      });
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return registry;
}

let registryCache: ReadonlyArray<ComponentDocEntry> | undefined;

export function getComponentDocsRegistry(): ReadonlyArray<ComponentDocEntry> {
  registryCache ??= buildRegistry();
  return registryCache;
}

export function resetComponentDocsRegistryCache(): void {
  registryCache = undefined;
  mdxFrontmatter = undefined;
  mdxLazy = undefined;
  componentDocsErrors.length = 0;
}
