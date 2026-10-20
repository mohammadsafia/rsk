/** Paths (prefixes of tracked files) that belong to the kit's development home, not to an app started from it. */
export const DROP = [
  // Component docs and the docs site
  'src/component-docs/',
  'src/pages/docs/',
  'src/layouts/docs-layout/',
  'src/routes/docs-routes.tsx',
  'src/routes/docs-gate.test.ts',
  'tests/docs/',
  'scripts/docs/',
  '.github/workflows/docs.yml',
  'src/types/doc-counts.d.ts',
  'src/types/mdx.d.ts',
  // Showcase pages and their data
  'src/pages/components/',
  'src/pages/clinic/',
  'src/routes/clinic-routes.test.ts',
  'src/pages/members/',
  'src/pages/home/',
  'src/api/clinic/',
  'src/views/home/',
  'src/locales/en/docs.json',
  'src/locales/ar/docs.json',
  'src/locales/en/clinic.json',
  'src/locales/ar/clinic.json',
  'src/locales/en/members.json',
  'src/locales/ar/members.json',
  'src/locales/en/home.json',
  'src/locales/ar/home.json',
  'src/locales/en/components.json',
  'src/locales/ar/components.json',
  // This repository's own tooling, plans and editor state
  'scripts/starter/',
  // Renders RSK's own logo favicons; an app replaces public/ favicons with its own.
  'scripts/design-system/favicons/',
  'tests/starter/',
  '.github/workflows/starter-sync.yml',
  'docs/',
  '.superpowers/',
  '.claude/',
  '.idea/',
  '.impeccable.md',
  'skills-lock.json',
  'AGENTS.md',
  '.env',
] as const;

/** Dependencies only the docs site uses. */
export const DOCS_ONLY_DEV_DEPENDENCIES = [
  '@clack/prompts',
  '@mdx-js/react',
  '@mdx-js/rollup',
  '@types/mdx',
  'gray-matter',
  'rehype-pretty-code',
  'remark-frontmatter',
  'remark-gfm',
  'remark-mdx-frontmatter',
  'shiki',
] as const;

/** `nav.json` labels that only the showcase menu uses. */
export const SHOWCASE_NAV_KEYS = ['schedule', 'patients', 'billing', 'components', 'members'] as const;

export const DOCS_ONLY_SCRIPTS = ['docs:new', 'docs:lint', 'starter:build', 'starter:verify', 'starter:publish'] as const;

/** Words that must not survive in the starter's src/ (showcase leftovers). */
export const LEFTOVER_PATTERNS = [
  /component-docs/,
  /DocsLayout/,
  /@pages\/clinic/,
  /@api\/clinic/,
  /__RSK_DOC_COUNTS__/,
  /\.mdx\b/,
] as const;
