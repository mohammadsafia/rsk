import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';

import { THEME_COLORS } from '@app-config';

import { dirOf, isLang, LANGS } from '@env';
import { getT } from '@server/i18n';

import { OgText } from './og-text';

// The picture a shared link shows (Open Graph and Twitter), drawn per language at build time. next/og needs a TTF/OTF
// font file, so the kit's Arabic font ships in assets/og (OFL), subset to Arabic without the contextual lookups satori
// can't read; Latin text falls back to next/og's own font.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'RSK';

/** Both images are drawn at build time. */
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const font = () => readFile(path.join(process.cwd(), 'assets/og/NotoKufiArabic-Bold.ttf'));

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = isLang(raw) ? raw : 'en';
  const t = await getT(lang, 'common');
  const dir = dirOf(lang);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: dir === 'rtl' ? 'flex-end' : 'flex-start',
        gap: 32,
        padding: 96,
        background: THEME_COLORS.dark,
        color: THEME_COLORS.light,
        fontFamily: 'Noto Kufi Arabic',
      }}
    >
      <div style={{ fontSize: 120, lineHeight: 1 }}>RSK</div>
      <OgText text={t('app.description')} dir={dir} style={{ fontSize: 48, lineHeight: 1.5, maxWidth: 1000 }} />
    </div>,
    { ...size, fonts: [{ name: 'Noto Kufi Arabic', data: await font(), weight: 700, style: 'normal' }] },
  );
}
