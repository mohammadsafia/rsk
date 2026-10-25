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
  // How blocks are authored in the kit (each documented, at least one); an app only adds them
  'tests/design-system/blocks.test.ts',
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
  // Screenshot tests shoot the docs site, which the starter doesn't have.
  'tests/visual/',
  'playwright.config.ts',
  '.github/workflows/visual.yml',
  '.github/workflows/starter-sync.yml',
  '.github/workflows/starter-verify.yml',
  'docs/',
  '.superpowers/',
  '.claude/',
  '.idea/',
  '.impeccable.md',
  'skills-lock.json',
  'AGENTS.md',
  '.env',
  // Deploys this repository's docs site.
  'vercel.json',
] as const;

/** Dependencies only the docs site uses. */
export const DOCS_ONLY_DEV_DEPENDENCIES = [
  '@mdx-js/react',
  '@mdx-js/rollup',
  '@types/mdx',
  'gray-matter',
  'rehype-pretty-code',
  'remark-frontmatter',
  'remark-gfm',
  'remark-mdx-frontmatter',
  'shiki',
  // The screenshot tests' runner (tests/visual).
  '@playwright/test',
] as const;

/** `nav.json` labels that only the showcase menu uses. */
export const SHOWCASE_NAV_KEYS = ['schedule', 'patients', 'billing', 'components', 'members'] as const;

export const DOCS_ONLY_SCRIPTS = [
  'docs:new',
  'docs:lint',
  'starter:build',
  'starter:verify',
  'starter:publish',
  'visual:test',
  'visual:update',
] as const;

/** Words that must not survive in the starter's src/ (showcase leftovers). */
export const LEFTOVER_PATTERNS = [
  /component-docs/,
  /DocsLayout/,
  /@pages\/clinic/,
  /@api\/clinic/,
  /__RSK_DOC_COUNTS__/,
  /\.mdx\b/,
] as const;

/** Dependencies only the Next starter uses: the repo has them so its lockfile and store cover the Next build. */
export const NEXT_ONLY_DEPENDENCIES = ['next', 'server-only', '@tailwindcss/postcss', 'postcss'] as const;

/** Of those, the ones a Next app runs on (dependencies); the rest stay devDependencies. */
export const NEXT_RUNTIME_DEPENDENCIES = ['next', 'server-only'] as const;

/**
 * Files of the Vite starter a Next starter replaces with app/, proxy.ts and next.config.ts (or doesn't need). The kit's
 * own files are never here: both starters ship the same kit (kit.lock.json `files` are identical).
 */
export const NEXT_DROP = [
  'index.html',
  'src/main.tsx',
  'src/bootstrap.tsx',
  'src/bootstrap.test.tsx',
  'src/App.tsx',
  'src/vite-env.d.ts',
  'src/i18n.test.ts',
  'src/routes/router.tsx',
  'src/routes/RoutePlaceholders.test.tsx',
  'src/layouts/auth-guard/',
  'src/layouts/error-boundary/',
  'src/layouts/app-layout/AppLayout.tsx',
  'src/layouts/app-layout/AppLayout.test.tsx',
  'src/layouts/auth-layout/AuthLayout.tsx',
  'src/pages/auth/auth-flow.test.tsx',
  'src/blocks/index.ts',
] as const;

/** Vite-only scripts a Next app doesn't have (it builds and serves with next). */
export const NEXT_DROP_SCRIPTS = ['preview', 'build:dev', 'bundle:report'] as const;
