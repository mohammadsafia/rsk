import { describe, expect, it } from 'vite-plus/test';

import { contrastRatio, oklchToSrgb, parseOklch } from './color';
import { extractBlock, readProjectFile, resolveToken } from './css-tokens';

const TEXT = 4.5;
const UI = 3;

/** [foreground role, background role, minimum ratio] — spec §7.8.1 */
const PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ['fg', 'canvas', TEXT],
  ['fg', 'surface', TEXT],
  ['fg', 'surface-raised', TEXT],
  ['fg', 'surface-sunken', TEXT],
  ['fg-muted', 'canvas', TEXT],
  ['fg-muted', 'surface', TEXT],
  ['fg-muted', 'surface-raised', TEXT],
  ['fg-muted', 'surface-sunken', TEXT],
  ['accent', 'surface', TEXT],
  ['success', 'surface', TEXT],
  ['warning', 'surface', TEXT],
  ['danger', 'surface', TEXT],
  ['info', 'surface', TEXT],
  ['accent-fg', 'accent', TEXT],
  ['inverse-fg', 'inverse', TEXT],
  ['fg-inverse', 'inverse', TEXT],
  ['success-fg', 'success', TEXT],
  ['warning-fg', 'warning', TEXT],
  ['danger-fg', 'danger', TEXT],
  ['info-fg', 'info', TEXT],
  ['border-strong', 'surface', UI],
  ['ring', 'surface', UI],
  ['ring', 'canvas', UI],
  ['fg-subtle', 'surface', UI],
];

const tokensCss = readProjectFile('src/styles/tokens.css');

const opaqueRgb = (vars: Record<string, string>, role: string) => {
  const color = parseOklch(resolveToken(vars, role));
  expect(color.alpha, `--${role} must be opaque to be contrast-tested`).toBe(1);
  return oklchToSrgb(color);
};

describe('semantic token contrast (WCAG AA)', () => {
  it('declares light tokens on both :root and .light so light panels work inside the dark app', () => {
    expect(tokensCss).toContain(':root,\n.light {');
  });

  for (const mode of ['.light', '.dark'] as const) {
    describe(mode, () => {
      const vars = extractBlock(tokensCss, mode);

      for (const [foreground, background, minimum] of PAIRS) {
        it(`${foreground} on ${background} ≥ ${minimum}:1`, () => {
          const ratio = contrastRatio(opaqueRgb(vars, foreground), opaqueRgb(vars, background));
          expect(ratio).toBeGreaterThanOrEqual(minimum);
        });
      }
    });
  }
});
