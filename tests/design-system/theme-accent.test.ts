// tests/design-system/theme-accent.test.ts — any brand colour becomes accent tokens that pass WCAG AA in both modes.
import { describe, expect, it } from 'vite-plus/test';

import { compositeOver, contrastRatio, hexToOklch, inGamut, oklchToSrgb, parseColor, parseOklch } from '../../scripts/design-system/color';
import { accentTheme, applyAccent, brandNotes, formatOklch } from '../../scripts/design-system/theme-accent';
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
  lime: '#a3e635',
  black: '#000',
  white: '#fff',
  nearWhite: '#fafafa',
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

  it('keeps fg and fg-muted readable on the subtle tint in both modes (composited over the surface)', () => {
    for (const [mode, vars] of [
      ['light', light],
      ['dark', dark],
    ] as const) {
      const tint = compositeOver(parseOklch(theme[mode].subtle), rgb(vars.surface));
      for (const text of ['fg', 'fg-muted']) expect(contrastRatio(rgb(vars[text]), tint), `${mode} ${text}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives the focus glow (ring-subtle) the brand too', () => {
    expect(parseOklch(theme.light.ringSubtle).h).toBeCloseTo(parseOklch(theme.light.accent).h, 0);
    expect(parseOklch(theme.dark.ringSubtle).alpha).toBeLessThan(0.5);
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
    const untouched = (css: string) => css.split('\n').filter((line) => !/--(accent(-hover|-subtle)?|ring-subtle):/.test(line));
    expect(untouched(next)).toEqual(untouched(tokensCss));
  });

  it('writes plain oklch() values the contrast test can read', () => {
    expect(formatOklch({ l: 0.4321, c: 0.12345, h: 14.98, alpha: 1 })).toBe('oklch(0.432 0.123 15)');
    expect(formatOklch({ l: 0.7, c: 0.1, h: 12, alpha: 0.11 })).toBe('oklch(0.7 0.1 12 / 11%)');
  });
});

describe('applyAccent robustness', () => {
  const theme = accentTheme(hexToOklch('#0f766e'), { light, dark });

  it('leaves a commented-out declaration alone and rewrites the real one', () => {
    const css = tokensCss.replace('  --accent: ', '  /* --accent: old */\n  --accent: ');
    const next = applyAccent(css, theme);
    expect(next).toContain('/* --accent: old */');
    expect(next).toContain(`\n  --accent: ${theme.light.accent};`);
  });

  it('reads CRLF files and keeps their line endings', () => {
    const next = applyAccent(tokensCss.replace(/\n/g, '\r\n'), theme);
    expect(next).toContain(`--accent: ${theme.light.accent};\r\n`);
  });

  it('refuses a tokens.css whose accent tokens it cannot find exactly once per mode', () => {
    expect(() => applyAccent(tokensCss.replace(/--accent-hover:[^;]+;\n/, ''), theme)).toThrow(/accent-hover/);
  });

  it('rewrites ring-subtle too', () => {
    expect(extractBlock(applyAccent(tokensCss, theme), '.dark')['ring-subtle']).toBe(theme.dark.ringSubtle);
  });
});

describe('input and notes', () => {
  it('reads the colour forms people paste: #rrggbbaa, oklch with % lightness and deg hue', () => {
    expect(parseColor('#0f766eff').h).toBeCloseTo(hexToOklch('#0f766e').h, 3);
    expect(parseColor('oklch(55% 0.12 190deg)')).toMatchObject({ l: 0.55, c: 0.12, h: 190 });
    expect(() => parseColor('rgb(1 2 3)')).toThrow(/hex|oklch/);
  });

  it('keeps a neutral brand neutral (no tinted subtle)', () => {
    expect(parseOklch(accentTheme(hexToOklch('#6b7280'), { light, dark }).light.subtle).c).toBeLessThan(0.01);
  });

  it('says when light mode had to change the brand a lot (yellow), and stays quiet for a mid-tone brand', () => {
    const notes = (hex: string) => brandNotes(hexToOklch(hex), accentTheme(hexToOklch(hex), { light, dark }));
    expect(notes('#facc15').join(' ')).toMatch(/light mode/i);
    expect(notes('#0f766e')).toEqual([]);
  });
});
