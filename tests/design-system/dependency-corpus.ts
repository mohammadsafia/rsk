// tests/design-system/dependency-corpus.ts
import { existsSync } from 'node:fs';

const SOURCE = /\.(ts|tsx|mts|mjs|js|css|mdx|json|ya?ml|html)$/;
/**
 * Files that name packages as data, not as uses: the starter manifest lists the docs-only packages it drops, so
 * reading it would make every one of them look used.
 */
const NAMES_PACKAGES = new Set(['scripts/starter/manifest.ts']);

/**
 * The files whose text decides whether a dependency is used: sources only, never the package manifest or lockfile
 * or a file that only names packages, and only files that exist (`git ls-files` still lists a deleted, unstaged one).
 */
export const corpusFiles = (files: string[], root: string): string[] =>
  files.filter(
    (file) =>
      SOURCE.test(file) &&
      !/(^|\/)(package\.json|pnpm-lock\.yaml)$/.test(file) &&
      !NAMES_PACKAGES.has(file) &&
      existsSync(`${root}${file}`),
  );
