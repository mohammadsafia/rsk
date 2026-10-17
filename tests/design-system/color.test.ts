import { describe, expect, it } from 'vite-plus/test';

import { compositeOver, contrastRatio, oklchToSrgb, parseOklch, relativeLuminance } from './color';
import { extractBlock, readProjectFile, resolveToken } from './css-tokens';

describe('parseOklch', () => {
  it('parses an opaque color', () => {
    expect(parseOklch('oklch(0.5 0.1 120)')).toEqual({ l: 0.5, c: 0.1, h: 120, alpha: 1 });
  });

  it('parses a color with percentage alpha', () => {
    expect(parseOklch('oklch(0.698 0.125 12 / 25%)').alpha).toBeCloseTo(0.25);
  });

  it('rejects non-oklch values', () => {
    expect(() => parseOklch('#ffffff')).toThrow('Not an oklch() color: #ffffff');
  });
});

describe('oklchToSrgb + contrastRatio', () => {
  const white = oklchToSrgb(parseOklch('oklch(1 0 0)'));
  const black = oklchToSrgb(parseOklch('oklch(0 0 0)'));

  it('maps the extremes to sRGB white and black', () => {
    white.forEach((channel) => expect(channel).toBeCloseTo(1, 3));
    black.forEach((channel) => expect(channel).toBeCloseTo(0, 3));
  });

  it('computes the WCAG maximum ratio for white on black', () => {
    expect(relativeLuminance(white)).toBeCloseTo(1, 3);
    expect(contrastRatio(white, black)).toBeCloseTo(21, 1);
  });

  it('matches a known pair: dark accent on dark surface ≈ 6.4:1', () => {
    const accent = oklchToSrgb(parseOklch('oklch(0.698 0.125 12)'));
    const surface = oklchToSrgb(parseOklch('oklch(0.196 0.006 271.1)'));
    expect(contrastRatio(accent, surface)).toBeCloseTo(6.4, 1);
  });

  it('is symmetric', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(contrastRatio(white, black), 6);
  });
});

describe('css-tokens', () => {
  const css = `:root,\n.light {\n  --a: oklch(1 0 0);\n  --b: var(--a);\n  --c: var(--b);\n}\n\n.dark {\n  --a: oklch(0 0 0);\n  --loop: var(--loop);\n}\n`;

  it('extracts the custom properties of a block', () => {
    expect(extractBlock(css, '.light')).toEqual({ a: 'oklch(1 0 0)', b: 'var(--a)', c: 'var(--b)' });
    expect(extractBlock(css, '.dark').a).toBe('oklch(0 0 0)');
  });

  it('throws on a missing selector', () => {
    expect(() => extractBlock(css, '.sepia')).toThrow('Selector not found: .sepia');
  });

  it('resolves var() chains', () => {
    expect(resolveToken(extractBlock(css, '.light'), 'c')).toBe('oklch(1 0 0)');
  });

  it('throws on missing tokens and cycles', () => {
    expect(() => resolveToken(extractBlock(css, '.light'), 'zzz')).toThrow('Token --zzz is not defined');
    expect(() => resolveToken(extractBlock(css, '.dark'), 'loop')).toThrow('Cycle at --loop');
  });

  it('reads files relative to the repo root', () => {
    expect(readProjectFile('package.json')).toMatch(/"name": "[^"]+"/);
  });
});

describe('compositeOver', () => {
  it('returns the top color when it is opaque', () => {
    expect(compositeOver(parseOklch('oklch(1 0 0)'), [0, 0, 0])).toEqual(oklchToSrgb(parseOklch('oklch(1 0 0)')));
  });

  it('blends a translucent color over the background in gamma-encoded sRGB', () => {
    const [r, g, b] = compositeOver(parseOklch('oklch(1 0 0 / 25%)'), [0, 0, 0]);
    [r, g, b].forEach((channel) => expect(channel).toBeCloseTo(0.25, 3));
  });
});
