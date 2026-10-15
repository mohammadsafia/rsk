/**
 * Color math for design-token tests: OKLCH → sRGB (Björn Ottosson's OKLab matrices)
 * and WCAG 2.x relative luminance / contrast ratio.
 */

export type Oklch = { l: number; c: number; h: number; alpha: number };

type Rgb = [number, number, number];

const OKLCH_PATTERN = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)%)?\s*\)$/;

export function parseOklch(value: string): Oklch {
  const match = OKLCH_PATTERN.exec(value.trim());
  if (!match) throw new Error(`Not an oklch() color: ${value}`);

  return {
    l: Number(match[1]),
    c: Number(match[2]),
    h: Number(match[3]),
    alpha: match[4] === undefined ? 1 : Number(match[4]) / 100,
  };
}

const encodeGamma = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055);

const decodeGamma = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);

const clamp01 = (channel: number) => Math.min(1, Math.max(0, channel));

export function oklchToSrgb({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  const lCone = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCone = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear: Rgb = [
    4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  ];

  return linear.map((channel) => clamp01(encodeGamma(channel))) as Rgb;
}

export function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(decodeGamma);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}
