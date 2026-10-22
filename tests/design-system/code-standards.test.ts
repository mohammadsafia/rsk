// tests/design-system/code-standards.test.ts — the machine-checkable rules of docs/CODE_STANDARDS.md, over the code
// held to them (blocks, the sign-in pages, layouts, the lazy palette). The rest of the standards are reviewed with the
// forge skills (forge:review-code) before each commit.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/** Folders and files held to the standards by this test. Add to it as code is brought up to them. */
export const SCOPE = [
  'src/blocks',
  'src/pages/auth',
  'src/layouts/auth-layout',
  'src/components/shared/command-palette/LazyCommandPalette.tsx',
  // A Next app's routes and layouts, when there are any.
  'app',
];

type Rule = { id: string; standard: string; pattern: RegExp; tsxOnly?: boolean };

/** Each rule names the CODE_STANDARDS.md entry it enforces. */
export const RULES: Rule[] = [
  { id: 'jsx-and', standard: '6.1 Conditional, not &&', pattern: /\{[^{}\n]*\s&&\s*\(?\s*<[A-Za-z]/, tsxOnly: true },
  { id: 'jsx-and-multiline', standard: '6.1 Conditional, not &&', pattern: /\{[^{}\n]*\s&&\s*\($/, tsxOnly: true },
  {
    id: 'jsx-ternary',
    standard: '6.2 Conditional, not a ternary',
    pattern: /\?\s*\(?\s*<[A-Za-z]|\?\s*\($|^\s*\)\s*:\s*\(?\s*<|\)\s*:\s*null\s*\}?;?$/,
    tsxOnly: true,
  },
  { id: 'interface', standard: '2.1 type, not interface', pattern: /^\s*(export\s+)?interface\s/ },
  {
    id: 'deep-component-import',
    standard: '1.2/1.3 barrels only',
    pattern: /from '@components\/(ui|shared|forms|tables|calendar|charts)\/[^']+'/,
  },
  { id: 'deep-relative-import', standard: '1.1 aliases, not ../../', pattern: /from '\.\.\/\.\.\// },
  { id: 'inline-svg', standard: '5.7 no inline SVG', pattern: /<svg[\s>]/, tsxOnly: true },
  {
    id: 'inline-handler',
    standard: '12.3 handle* handlers, not inline',
    pattern: /\bon[A-Z]\w*=\{(async\s*)?\([^)]*\)\s*=>\s*\{\s*$/,
    tsxOnly: true,
  },
  { id: 'empty-catch', standard: '12.4 never swallow errors', pattern: /catch\s*(\([^)]*\))?\s*\{\s*\}/ },
];

const walk = (target: string): string[] => {
  const full = path.join(ROOT, target);
  if (!existsSync(full)) return [];
  if (!statSync(full).isDirectory()) return [target];
  return readdirSync(full).flatMap((name) => walk(path.posix.join(target, name)));
};

/** Every violation in `files`, as "file:line rule (standard)". */
export function violations(files: string[]): string[] {
  return files.flatMap((file) =>
    readFileSync(path.join(ROOT, file), 'utf8')
      .split('\n')
      .flatMap((line, index) =>
        RULES.filter((rule) => (!rule.tsxOnly || file.endsWith('.tsx')) && rule.pattern.test(line)).map(
          (rule) => `${file}:${index + 1} ${rule.id} (${rule.standard})`,
        ),
      ),
  );
}

const inScope = () => SCOPE.flatMap(walk).filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file));

describe('code standards (machine-checkable part of docs/CODE_STANDARDS.md)', () => {
  it('finds no violations in the code held to them', () => {
    expect(violations(inScope())).toEqual([]);
  });
});
