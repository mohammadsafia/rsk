import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { SEMANTIC_COLOR_ROLES } from '../../src/lib/constants/DesignTokens';
import { extractBlock, readProjectFile } from './css-tokens';

const SRC_DIR = fileURLToPath(new URL('../../src/', import.meta.url));

const tokensCss = readProjectFile('src/styles/tokens.css');
const themeCss = readProjectFile('src/styles/theme.css');
const indexCss = readProjectFile('src/index.css');

const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });

describe('semantic color roles', () => {
  for (const mode of ['.light', '.dark'] as const) {
    it(`defines every role in ${mode}`, () => {
      const vars = extractBlock(tokensCss, mode);
      const missing = SEMANTIC_COLOR_ROLES.map((role) => role.token).filter((token) => !(token in vars));
      expect(missing).toEqual([]);
    });
  }

  it('exposes every role as a Tailwind color', () => {
    const missing = SEMANTIC_COLOR_ROLES.map((role) => role.token).filter(
      (token) => !themeCss.includes(`--color-${token}: var(--${token});`),
    );
    expect(missing).toEqual([]);
  });

  it('resets the default Tailwind palette before any color is defined', () => {
    expect(themeCss.indexOf('--color-*: initial;')).toBeGreaterThan(-1);
    expect(themeCss.indexOf('--color-*: initial;')).toBeLessThan(themeCss.indexOf('--color-canvas'));
  });
});

describe('index.css import order', () => {
  it('imports palette → tokens → theme → legacy bridge', () => {
    const order = ['./styles/palette.css', './styles/tokens.css', './styles/theme.css', './styles/legacy-tokens.css'].map((file) =>
      indexCss.indexOf(`@import '${file}';`),
    );
    order.forEach((position) => expect(position).toBeGreaterThan(-1));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('legacy accent migration', () => {
  it('leaves no usage of the old soft-hover accent utilities in src/', () => {
    const legacyAccent = /\b(?:bg|text|border|ring)-accent-(?:foreground|200|300|400)\b|(?:focus|hover|data-\[[^\]]+\]):bg-accent(?![-\w])/;
    const offenders = listFiles(SRC_DIR)
      .filter((file) => /\.(tsx|ts|mdx)$/.test(file))
      .filter((file) => legacyAccent.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(SRC_DIR, 'src/'));
    expect(offenders).toEqual([]);
  });
});
