/**
 * Color math for the design tokens: OKLCH ↔ sRGB (Björn Ottosson's OKLab matrices), WCAG 2.x relative luminance and
 * contrast ratio. Used by the contrast tests and by `pnpm theme:accent`.
 */

export type Oklch = { l: number; c: number; h: number; alpha: number };

export type Rgb = [number, number, number];

const NUMBER = /^[\d.]+$/;

/** `oklch(l c h)` or `oklch(l c h / a%)`, read piece by piece (a single pattern for it backtracks). */
export function parseOklch(value: string): Oklch {
  const text = value.trim();
  const fail = () => new Error(`Not an oklch() color: ${value}`);
  if (!text.startsWith('oklch(') || !text.endsWith(')')) throw fail();
  const [channels, alpha, ...extra] = text.slice('oklch('.length, -1).split('/');
  const [l, c, h, ...more] = channels.trim().split(/\s+/);
  const alphaText = alpha?.trim();
  if (extra.length || more.length || ![l, c, h].every((part) => part !== undefined && NUMBER.test(part))) throw fail();
  if (alphaText !== undefined && !(alphaText.endsWith('%') && NUMBER.test(alphaText.slice(0, -1)))) throw fail();

  return {
    l: Number(l),
    c: Number(c),
    h: Number(h),
    alpha: alphaText === undefined ? 1 : Number(alphaText.slice(0, -1)) / 100,
  };
}

const encodeGamma = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055);

const decodeGamma = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);

const clamp01 = (channel: number) => Math.min(1, Math.max(0, channel));

/** Linear-light sRGB channels, unclamped (outside 0–1 means sRGB can't show the colour). */
function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  const lCone = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCone = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  ];
}

/** Whether sRGB can show the colour as it is (a hair of tolerance for rounding). */
export const inGamut = (color: Oklch) => oklchToLinear(color).every((channel) => channel >= -0.0001 && channel <= 1.0001);

export function srgbToOklch([red, green, blue]: Rgb): Oklch {
  const [r, g, b] = [red, green, blue].map(decodeGamma);
  const lCone = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mCone = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sCone = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const l = 0.2104542553 * lCone + 0.793617785 * mCone - 0.0040720468 * sCone;
  const a = 1.9779984951 * lCone - 2.428592205 * mCone + 0.4505937099 * sCone;
  const bAxis = 0.0259040371 * lCone + 0.7827717662 * mCone - 0.808675766 * sCone;
  const c = Math.hypot(a, bAxis);
  const h = c < 1e-7 ? 0 : ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h, alpha: 1 };
}

/** "#rgb" or "#rrggbb" as OKLCH. */
export function hexToOklch(hex: string): Oklch {
  const value = hex.trim().replace(/^#/, '');
  // #rgb, #rrggbb, or #rrggbbaa (the alpha is ignored: an accent is opaque).
  const full = value.length === 3 ? value.replace(/./g, '$&$&') : value.length === 8 ? value.slice(0, 6) : value;
  if (!/^[\da-f]{6}$/i.test(full)) throw new Error(`Not a hex colour: ${hex}`);
  const channels = [0, 2, 4].map((index) => Number.parseInt(full.slice(index, index + 2), 16) / 255) as Rgb;
  return srgbToOklch(channels);
}

export function oklchToSrgb(color: Oklch): Rgb {
  return oklchToLinear(color).map((channel) => clamp01(encodeGamma(channel))) as Rgb;
}

export function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(decodeGamma);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Alpha-composites `top` over an opaque sRGB `bottom` the way browsers do (gamma-encoded sRGB). */
export function compositeOver(top: Oklch, bottom: Rgb): Rgb {
  const topRgb = oklchToSrgb(top);
  return topRgb.map((channel, index) => channel * top.alpha + bottom[index] * (1 - top.alpha)) as Rgb;
}

/** A colour as people paste it: `#rgb`, `#rrggbb`, `#rrggbbaa`, or `oklch(L C H)` with L as 0–1 or a %, H optionally in deg. */
export function parseColor(input: string): Oklch {
  const value = input.trim();
  if (value.startsWith('#')) return hexToOklch(value);
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/i.exec(value);
  if (!match) throw new Error(`Not a colour this accepts: ${input}. Use a hex value (#0f766e) or oklch(0.55 0.12 190).`);
  const l = Number(match[1]) / (match[2] ? 100 : 1);
  return { l, c: Number(match[3]), h: Number(match[4]), alpha: 1 };
}
