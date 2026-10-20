/**
 * Gives the kit your brand colour: computes the accent tokens for light and dark mode from one colour, keeping its hue
 * and as much of its chroma as sRGB allows, at the lightness that passes WCAG AA wherever the accent is used — as text
 * on every surface, and behind the accent's own text and its hover. Writes them into src/styles/tokens.css.
 *
 *   pnpm theme:accent "#0f766e"
 *   pnpm theme:accent "oklch(0.55 0.12 190)" --dry-run
 *
 * --ring-subtle (the focus glow) is written too; --ring, --ink and the first chart colour follow --accent. tests/design-system/contrast.test.ts
 * checks the result like any other token change.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { compositeOver, contrastRatio, inGamut, type Oklch, oklchToSrgb, parseColor, parseOklch } from './color';

type Vars = Record<string, string>;
type ModeAccent = { accent: string; hover: string; subtle: string; ringSubtle: string };
export type AccentTheme = { light: ModeAccent; dark: ModeAccent };

const AA = 4.5;
const SURFACES = ['canvas', 'surface', 'surface-raised', 'surface-sunken'];

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/** `oklch(l c h)` / `oklch(l c h / a%)`, rounded the way tokens.css writes them. */
export function formatOklch({ l, c, h, alpha }: Oklch) {
  // Chroma rounds down: rounding up could push a colour that just fits sRGB outside it.
  const body = `${round(l, 3)} ${Math.floor(c * 1000) / 1000} ${round(h, 1)}`;
  return alpha < 1 ? `oklch(${body} / ${Math.round(alpha * 100)}%)` : `oklch(${body})`;
}

/** The most chroma sRGB can show at this lightness and hue, up to `wanted`. */
function fitChroma(l: number, h: number, wanted: number): number {
  // A little inside the edge, so rounding the hue for tokens.css can't step outside it.
  const fits = (c: number) => inGamut({ l, c: c * 1.01, h, alpha: 1 });
  if (fits(wanted)) return wanted;
  let low = 0;
  let high = wanted;
  for (let step = 0; step < 30; step += 1) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }
  return low;
}

/** The colour at lightness `l` in the brand's hue, chroma fitted to sRGB, rounded as it will be written. */
const at = (brand: Oklch, l: number): Oklch => {
  const exact = { l, c: fitChroma(l, brand.h, brand.c), h: brand.h, alpha: 1 };
  return parseOklch(formatOklch(exact));
};

const ratio = (color: Oklch, other: string) => contrastRatio(oklchToSrgb(color), oklchToSrgb(parseOklch(other)));

/** Whether `color` works as the accent of a mode: text on every surface, and behind the accent's own text. */
const passes = (color: Oklch, vars: Vars) =>
  SURFACES.every((surface) => ratio(color, vars[surface]) >= AA) && ratio(color, vars['accent-fg']) >= AA;

/**
 * Searches lightness in 0.001 steps from the brand's own, in the direction contrast improves (darker in light mode,
 * lighter in dark mode), and returns the first colour that passes — the closest to the brand that is accessible.
 */
function closestPassing(brand: Oklch, vars: Vars, direction: -1 | 1, start: number, limit: number): Oklch {
  for (let l = start; direction < 0 ? l >= limit : l <= limit; l = round(l + direction * 0.001, 3)) {
    const candidate = at(brand, l);
    if (passes(candidate, vars)) return candidate;
  }
  throw new Error(`No accessible accent found for ${formatOklch(brand)}`);
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Whether fg and fg-muted stay readable (AA) on a tint, composited over the mode's surface. */
const readableOn = (tint: Oklch, vars: Vars) => {
  const background = compositeOver(tint, oklchToSrgb(parseOklch(vars.surface)));
  return ['fg', 'fg-muted'].every((text) => contrastRatio(oklchToSrgb(parseOklch(vars[text])), background) >= AA);
};

/** Light and dark accent tokens from a brand colour, given each mode's surfaces and accent-fg. */
export function accentTheme(brand: Oklch, { light, dark }: { light: Vars; dark: Vars }): AccentTheme {
  // A neutral brand stays neutral: its hue is meaningless, so it tints nothing.
  const tintChroma = brand.c < 0.02 ? 0 : Math.min(0.03, brand.c * 0.12 + 0.004);

  // Light mode: the accent carries white text and sits as text on white, so it must be dark enough. The search starts
  // inside its range, so black or white brands still get an answer.
  const lightAccent = closestPassing(brand, light, -1, clamp(round(brand.l, 3), 0.05, 0.7), 0.05);
  // Hover darkens a step; darker only raises the contrast with the white text on it.
  const lightHover = at(brand, Math.max(0.05, lightAccent.l - 0.06));
  // The subtle tint: as light as needed for text to stay readable on it.
  let lightSubtle: Oklch = { l: 0.953, c: fitChroma(0.953, brand.h, tintChroma), h: brand.h, alpha: 1 };
  while (!readableOn(lightSubtle, light) && lightSubtle.l < 0.995) lightSubtle = { ...lightSubtle, l: round(lightSubtle.l + 0.005, 3) };

  // Dark mode: the accent sits as text on near-black and carries dark text, so it must be light enough.
  const darkAccent = closestPassing(brand, dark, 1, clamp(round(brand.l, 3), 0.55, 0.97), 0.97);
  const darkHover = at(brand, Math.min(0.97, darkAccent.l + 0.05));
  // The subtle tint is the accent, faint; a light accent needs it fainter so text on it stays readable.
  let darkAlpha = 0.11;
  while (!readableOn({ ...darkAccent, alpha: darkAlpha }, dark) && darkAlpha > 0.03) darkAlpha = round(darkAlpha - 0.01, 2);

  return {
    light: {
      accent: formatOklch(lightAccent),
      hover: formatOklch(lightHover),
      subtle: formatOklch(lightSubtle),
      ringSubtle: formatOklch({ ...lightAccent, alpha: 0.2 }),
    },
    dark: {
      accent: formatOklch(darkAccent),
      hover: formatOklch(darkHover),
      subtle: formatOklch({ ...darkAccent, alpha: darkAlpha }),
      ringSubtle: formatOklch({ ...darkAccent, alpha: 0.25 }),
    },
  };
}

/** Plain-language notes when a mode had to move far from the brand to stay readable. */
export function brandNotes(brand: Oklch, theme: AccentTheme): string[] {
  const notes: string[] = [];
  for (const mode of ['light', 'dark'] as const) {
    const accent = parseOklch(theme[mode].accent);
    const lightness = accent.l - brand.l;
    const lostChroma = brand.c > 0.02 && accent.c < brand.c * 0.7;
    if (Math.abs(lightness) > 0.15 || lostChroma)
      notes.push(
        `In ${mode} mode your colour is ${lightness < 0 ? 'darker' : 'lighter'}${lostChroma ? ' and less saturated' : ''} (${formatOklch(accent)}) so text on and around it stays readable.`,
      );
  }
  return notes;
}

const TOKENS: Array<[string, keyof ModeAccent]> = [
  ['accent', 'accent'],
  ['accent-hover', 'hover'],
  ['accent-subtle', 'subtle'],
  ['ring-subtle', 'ringSubtle'],
];

/**
 * Rewrites --accent, --accent-hover, --accent-subtle and --ring-subtle in each mode's block of tokens.css, and nothing
 * else. Only a declaration that starts its line counts (a commented-out one doesn't), and each must appear exactly once
 * per mode, or the file is left alone with an error.
 */
export function applyAccent(css: string, theme: AccentTheme): string {
  const darkStart = css.search(/\r?\n\.dark\s*\{/);
  if (darkStart < 0) throw new Error('tokens.css has no .dark { … } block');
  const rewrite = (block: string, mode: ModeAccent, name: string) =>
    TOKENS.reduce((text, [token, key]) => {
      const pattern = new RegExp(`^(\\s*--${token}\\s*:\\s*)[^;]+;`, 'gm');
      const count = text.match(pattern)?.length ?? 0;
      if (count !== 1) throw new Error(`tokens.css: expected one --${token} in the ${name} block, found ${count}`);
      return text.replace(pattern, `$1${mode[key]};`);
    }, block);
  return rewrite(css.slice(0, darkStart), theme.light, 'light') + rewrite(css.slice(darkStart), theme.dark, 'dark');
}

/** The custom properties declared in one `selector { … }` block. */
function blockVars(source: string, selector: string): Vars {
  const css = source.replaceAll('\r\n', '\n');
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`tokens.css has no "${selector.replace('\n', ' ')} { … }" block`);
  const body = css.slice(start, css.indexOf('\n}', start));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

function main() {
  const [input] = process.argv.slice(2).filter((value) => !value.startsWith('--'));
  if (!input) throw new Error('usage: pnpm theme:accent "<#hex | oklch(l c h)>" [--dry-run]');
  const brand = parseColor(input);
  const file = path.resolve('src/styles/tokens.css');
  const css = readFileSync(file, 'utf8');
  const light = blockVars(css, ':root,\n.light');
  const dark = blockVars(css, '.dark');
  const theme = accentTheme(brand, { light, dark });

  const report = (mode: 'light' | 'dark', vars: Vars) => {
    const accent = parseOklch(theme[mode].accent);
    const onSurface = Math.min(...SURFACES.map((surface) => ratio(accent, vars[surface])));
    console.log(`  ${mode.padEnd(5)} accent ${theme[mode].accent}  hover ${theme[mode].hover}  subtle ${theme[mode].subtle}`);
    console.log(
      `        text on surfaces ≥ ${onSurface.toFixed(2)}:1, accent-fg on accent ${ratio(accent, vars['accent-fg']).toFixed(2)}:1`,
    );
  };
  console.log(`Brand ${formatOklch(brand)}:`);
  report('light', light);
  report('dark', dark);
  for (const note of brandNotes(brand, theme)) console.log(`  Note: ${note}`);

  if (process.argv.includes('--dry-run')) return;
  writeFileSync(file, applyAccent(css, theme));
  console.log('Wrote src/styles/tokens.css. Run vp test to recheck every contrast pair.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.dirname, 'theme-accent.ts')) main();
