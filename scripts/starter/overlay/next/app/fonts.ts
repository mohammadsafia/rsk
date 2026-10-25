import type { CSSProperties } from 'react';

import { Noto_Kufi_Arabic, Schibsted_Grotesk, Spline_Sans_Mono } from 'next/font/google';

const sans = Schibsted_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });
const arabic = Noto_Kufi_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600'], display: 'swap' });
const mono = Spline_Sans_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap' });

// Only the real family: next/font's size-adjusted fallback (local Arial, no unicode-range) would catch Arabic glyphs
// before Noto Kufi does. theme.css builds the per-glyph stacks from these variables.
const firstFamily = (stack: string) => stack.split(',')[0].trim();

/** The brand families for <html style>, shared by every root document (the [lang] layout, the global 404). */
export const fontVariables = {
  '--font-brand-sans': firstFamily(sans.style.fontFamily),
  '--font-brand-arabic': firstFamily(arabic.style.fontFamily),
  '--font-brand-mono': firstFamily(mono.style.fontFamily),
} as CSSProperties;
