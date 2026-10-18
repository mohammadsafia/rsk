import { describe, expect, it } from 'vite-plus/test';

import { compositeOver, contrastRatio, oklchToSrgb, parseOklch } from './color';
import { extractBlock, readProjectFile, resolveToken } from './css-tokens';

const TEXT = 4.5;
const UI = 3;

/** [foreground role, background role, minimum ratio] — spec §7.8.1 */
const PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ['fg', 'canvas', TEXT],
  // Code comments render in --code-muted on the code surface (dark in both themes).
  ['code-muted', 'code-surface', TEXT],
  ['code-foreground', 'code-surface', TEXT],
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
  ['fg-inverse', 'fg', TEXT],
  ['fg-inverse', 'fg-hover', TEXT],
  ['fg-inverse', 'fg-pressed', TEXT],
  ['accent-fg', 'accent-hover', TEXT],
  ['danger-fg', 'danger-hover', TEXT],
  ['success-fg', 'success', TEXT],
  ['warning-fg', 'warning', TEXT],
  ['danger-fg', 'danger', TEXT],
  ['info-fg', 'info', TEXT],
  ['border-strong', 'surface', UI],
  ['ring', 'surface', UI],
  ['ring', 'canvas', UI],
  ['fg-subtle', 'surface', UI],
  ['chart-1', 'surface', UI],
  ['chart-2', 'surface', UI],
  ['chart-3', 'surface', UI],
  ['chart-4', 'surface', UI],
  ['chart-5', 'surface', UI],
  ['chart-6', 'surface', UI],
  ['ink', 'surface', UI],
  ['ink', 'canvas', UI],
  ['rule-strong', 'surface', UI],
  ['rule-strong', 'surface-raised', UI],
];

const tokensCss = readProjectFile('src/styles/tokens.css');
/** Some roles (the code tokens) point at palette steps, so resolve through the palette too. */
const paletteVars = extractBlock(readProjectFile('src/styles/palette.css'), ':root');

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
      const vars = { ...paletteVars, ...extractBlock(tokensCss, mode) };

      for (const [foreground, background, minimum] of PAIRS) {
        it(`${foreground} on ${background} ≥ ${minimum}:1`, () => {
          const ratio = contrastRatio(opaqueRgb(vars, foreground), opaqueRgb(vars, background));
          expect(ratio).toBeGreaterThanOrEqual(minimum);
        });
      }
    });
  }
});

/** Status text on its own tint (Badge soft, Alert soft). Dark tints are translucent, so they are composited over surface first. */
const TINT_PAIRS = ['success', 'warning', 'danger', 'info'] as const;

describe('status text on its own tint (WCAG AA text)', () => {
  for (const mode of ['.light', '.dark'] as const) {
    const vars = extractBlock(tokensCss, mode);
    const surface = oklchToSrgb(parseOklch(resolveToken(vars, 'surface')));

    for (const status of TINT_PAIRS) {
      it(`${mode} ${status} on ${status}-subtle ≥ ${TEXT}:1`, () => {
        const text = oklchToSrgb(parseOklch(resolveToken(vars, status)));
        const tint = compositeOver(parseOklch(resolveToken(vars, `${status}-subtle`)), surface);
        expect(contrastRatio(text, tint)).toBeGreaterThanOrEqual(TEXT);
      });
    }
  }
});

/** Body text on every tint (selected rows use accent-subtle; calendar events use each status tint). SP2 deferred, owned by SP3 Plan C. */
describe('fg and fg-muted on tints (WCAG AA text)', () => {
  for (const mode of ['.light', '.dark'] as const) {
    const vars = extractBlock(tokensCss, mode);
    const surface = oklchToSrgb(parseOklch(resolveToken(vars, 'surface')));

    for (const tint of ['accent', 'success', 'warning', 'danger', 'info'] as const) {
      for (const text of ['fg', 'fg-muted'] as const) {
        it(`${mode} ${text} on ${tint}-subtle ≥ ${TEXT}:1`, () => {
          const foreground = oklchToSrgb(parseOklch(resolveToken(vars, text)));
          const background = compositeOver(parseOklch(resolveToken(vars, `${tint}-subtle`)), surface);
          expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(TEXT);
        });
      }
    }
  }
});
