import type { CSSProperties } from 'react';

import localFont from 'next/font/local';

// The same @fontsource-variable files a Vite app imports, served with the app: next build fetches nothing
// (next/font/google downloads at build time, which fails on a closed network or a flaky CI runner). One variable file
// per family. next/font reads these options at build time, so each path is written out in full.
const sans = localFont({
  src: '../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2',
  weight: '400 700',
  display: 'swap',
});
const arabic = localFont({
  src: '../node_modules/@fontsource-variable/noto-kufi-arabic/files/noto-kufi-arabic-arabic-wght-normal.woff2',
  weight: '400 600',
  display: 'swap',
});
const mono = localFont({
  src: '../node_modules/@fontsource-variable/spline-sans-mono/files/spline-sans-mono-latin-wght-normal.woff2',
  weight: '400 500',
  display: 'swap',
});

// Only the real family: next/font's size-adjusted fallback (local Arial, no unicode-range) would catch Arabic glyphs
// before Noto Kufi does. theme.css builds the per-glyph stacks from these variables.
const firstFamily = (stack: string) => stack.split(',')[0].trim();

/** The brand families for <html style>, shared by every root document (the [lang] layout, the global 404). */
export const fontVariables = {
  '--font-brand-sans': firstFamily(sans.style.fontFamily),
  '--font-brand-arabic': firstFamily(arabic.style.fontFamily),
  '--font-brand-mono': firstFamily(mono.style.fontFamily),
} as CSSProperties;
