// tests/design-system/theme-accent.test.ts — any brand colour becomes accent tokens that pass WCAG AA in both modes.
import { describe, expect, it } from 'vite-plus/test';

import { contrastRatio, hexToOklch, inGamut, oklchToSrgb, parseOklch } from '../../scripts/design-system/color';
import { accentTheme, applyAccent, formatOklch } from '../../scripts/design-system/theme-accent';
import { extractBlock, readProjectFile } from './css-tokens';

const tokensCss = readProjectFile('src/styles/tokens.css');
const light = extractBlock(tokensCss, ':root,\n.light');
const dark = extractBlock(tokensCss, '.dark');
const rgb = (value: string) => oklchToSrgb(parseOklch(value));

const BRANDS = {
  oxblood: '#7a1f2b',
  teal: '#0f766e',
  blue: '#2563eb',
  yellow: '#facc15',
  orange: '#f97316',
  green: '#16a34a',
  purple: '#9333ea',
  grey: '#6b7280',
};

describe('color parsing', () => {
  it('reads hex as OKLCH (white, black, a known blue)', () => {
    expect(hexToOklch('#fff').l).toBeCloseTo(1, 3);
    expect(hexToOklch('#000000').l).toBeCloseTo(0, 3);
    const blue = hexToOklch('#2563eb');
    expect(blue.l).toBeCloseTo(0.546, 2);
    expect(blue.h).toBeCloseTo(262.9, 0);
  });
});

describe.each(Object.entries(BRANDS))('accentTheme(%s)', (_name, hex) => {
  const brand = hexToOklch(hex);
  const theme = accentTheme(brand, { light, dark });

  it('passes AA in light mode: accent text on every surface, white text on the accent and its hover', () => {
    const accent = rgb(theme.light.accent);
    for (const surface of ['canvas', 'surface', 'surface-raised', 'surface-sunken'])
      expect(contrastRatio(accent, rgb(light[surface]))).toBeGreaterThanOrEqual(4.5);
    for (const fill of [theme.light.accent, theme.light.hover])
      expect(contrastRatio(rgb(light['accent-fg']), rgb(fill))).toBeGreaterThanOrEqual(4.5);
  });

  it('passes AA in dark mode: accent text on every surface, dark text on the accent and its hover', () => {
    const accent = rgb(theme.dark.accent);
    for (const surface of ['canvas', 'surface', 'surface-raised', 'surface-sunken'])
      expect(contrastRatio(accent, rgb(dark[surface]))).toBeGreaterThanOrEqual(4.5);
    for (const fill of [theme.dark.accent, theme.dark.hover])
      expect(contrastRatio(rgb(dark['accent-fg']), rgb(fill))).toBeGreaterThanOrEqual(4.5);
  });

  it('stays the brand: same hue, colours sRGB can show, a faint tint for the subtle background', () => {
    for (const value of [theme.light.accent, theme.light.hover, theme.dark.accent, theme.dark.hover]) {
      const color = parseOklch(value);
      expect(inGamut(color)).toBe(true);
      if (brand.c > 0.02) expect(Math.abs(color.h - brand.h)).toBeLessThan(1);
    }
    expect(parseOklch(theme.light.subtle).l).toBeGreaterThan(0.93);
    expect(parseOklch(theme.dark.subtle).alpha).toBeLessThan(0.2);
  });
});

describe('applyAccent', () => {
  it('rewrites the accent tokens of both modes and nothing else', () => {
    const theme = accentTheme(hexToOklch('#0f766e'), { light, dark });
    const next = applyAccent(tokensCss, theme);
    expect(extractBlock(next, ':root,\n.light')).toMatchObject({
      accent: theme.light.accent,
      'accent-hover': theme.light.hover,
      'accent-subtle': theme.light.subtle,
    });
    expect(extractBlock(next, '.dark')).toMatchObject({
      accent: theme.dark.accent,
      'accent-hover': theme.dark.hover,
      'accent-subtle': theme.dark.subtle,
    });
    const untouched = (css: string) => css.split('\n').filter((line) => !/--accent(-hover|-subtle)?:/.test(line));
    expect(untouched(next)).toEqual(untouched(tokensCss));
  });

  it('writes plain oklch() values the contrast test can read', () => {
    expect(formatOklch({ l: 0.4321, c: 0.12345, h: 14.98, alpha: 1 })).toBe('oklch(0.432 0.123 15)');
    expect(formatOklch({ l: 0.7, c: 0.1, h: 12, alpha: 0.11 })).toBe('oklch(0.7 0.1 12 / 11%)');
  });
});
