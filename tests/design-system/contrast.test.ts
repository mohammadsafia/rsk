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
  ['inverse-fg', 'inverse-hover', TEXT],
  ['inverse-fg', 'inverse-pressed', TEXT],
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

/**
 * The legacy bridge (deleted in sub-project 2) re-points old names at the new palette.
 * Its pairs are what most components still render today, so they get the same AA guard.
 * Variables are merged the way <html class="light|dark"> resolves them: palette → tokens → bridge.
 */
const paletteCss = readProjectFile('src/styles/palette.css');
const legacyCss = readProjectFile('src/styles/legacy-tokens.css');

const resolvedVars = (mode: '.light' | '.dark') => ({
  ...extractBlock(paletteCss, ':root'),
  ...extractBlock(tokensCss, '.light'),
  ...extractBlock(legacyCss, '.light'),
  ...(mode === '.dark' ? { ...extractBlock(tokensCss, '.dark'), ...extractBlock(legacyCss, '.dark') } : {}),
});

/** [foreground, background, modes] — legacy pairs used by Button, Calendar, Chip and Badge today. */
const LEGACY_PAIRS: ReadonlyArray<readonly [string, string, ReadonlyArray<'.light' | '.dark'>]> = [
  ['primary-foreground', 'primary', ['.light', '.dark']],
  ['primary-foreground', 'primary-600', ['.light']],
  ['primary-foreground', 'primary-300', ['.dark']],
  ['primary-foreground', 'primary-200', ['.dark']],
  ['destructive-foreground', 'destructive', ['.light', '.dark']],
  ['destructive-foreground', 'destructive-400', ['.dark']],
  ['success-foreground', 'success', ['.light', '.dark']],
  ['warning-foreground', 'warning-400', ['.light', '.dark']],
  ['destructive', 'destructive-200', ['.light', '.dark']],
  ['foreground', 'background', ['.light', '.dark']],
  ['muted-foreground', 'background', ['.light', '.dark']],
];

describe('legacy bridge contrast (WCAG AA text)', () => {
  for (const [foreground, background, modes] of LEGACY_PAIRS) {
    for (const mode of modes) {
      it(`${mode} ${foreground} on ${background} ≥ ${TEXT}:1`, () => {
        const vars = resolvedVars(mode);
        const ratio = contrastRatio(opaqueRgb(vars, foreground), opaqueRgb(vars, background));
        expect(ratio).toBeGreaterThanOrEqual(TEXT);
      });
    }
  }
});
