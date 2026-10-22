import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
// A Next app's app/ holds its layouts and pages.
const SCOPES = ['src/components', 'src/layouts', 'src/pages', 'src/views', 'app'];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/**
 * --fg-subtle only reaches 3:1, enough for non-text marks (icons, separators) and disabled controls (exempt in WCAG
 * 1.4.3), never for readable text, which needs 4.5:1 (use text-fg-muted). A line using text-fg-subtle must show it
 * styles a non-text or disabled element.
 */
const NON_TEXT = /disabled|aria-hidden|separator|\[&_svg\]|size-\d|size=\{|Icon|<svg|Glyph|FolderOpen|Circle|Search|placeholder/;
/** An icon component whose props continue on the next line (`<Square` then `className=…`). */
const ICON_OPENING = /<[A-Z][A-Za-z]+\s*$|size=\{|strokeWidth=\{/;

describe('fg-subtle is never used for readable text', () => {
  it('every text-fg-subtle sits on an icon, separator or disabled state', () => {
    // The starter strips some scopes (src/views), so only walk the ones present.
    const offenders = SCOPES.map((scope) => join(ROOT, scope))
      .filter((dir) => existsSync(dir))
      .flatMap(walk)
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
      .flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line, index, lines) => ({ line, previous: lines[index - 1] ?? '', at: `${relative(ROOT, file)}:${index + 1}` }))
          .filter(({ line, previous }) => /(?<![\w-])text-fg-subtle\b/.test(line) && !NON_TEXT.test(line) && !ICON_OPENING.test(previous))
          .map(({ at }) => at),
      );
    expect(offenders).toEqual([]);
  });
});
