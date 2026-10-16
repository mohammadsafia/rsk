import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(`${ROOT}${path}`);

/** PNG IHDR: width/height at 16/20, colour type at 25 (2 = RGB, 6 = RGBA). */
const pngInfo = (path: string) => {
  const png = read(path);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colourType: png[25] };
};

describe('favicon set', () => {
  it('ships every file the manifest and index.html reference', () => {
    for (const file of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
      expect(existsSync(`${ROOT}public/${file}`), file).toBe(true);
    }
    const html = read('index.html').toString();
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg"');
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="32x32"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png"');
    expect(html).toContain('<link rel="manifest" href="/site.webmanifest"');
    expect(html).toMatch(/<meta name="theme-color" media="\(prefers-color-scheme: dark\)"/);
    expect(html).toMatch(/<meta name="theme-color" media="\(prefers-color-scheme: light\)"/);
    expect(html).not.toMatch(/href=""|logo192|DM\+Sans|Playfair/);
  });

  it('switches inks by colour scheme inside the svg', () => {
    const svg = read('public/favicon.svg').toString();
    expect(svg).toContain('@media (prefers-color-scheme: light)');
    expect(svg.match(/<rect /g)).toHaveLength(5);
  });

  it('renders opaque PNGs at the right sizes (no iOS black square)', () => {
    expect(pngInfo('public/apple-touch-icon.png')).toEqual({ width: 180, height: 180, colourType: 2 });
    expect(pngInfo('public/icon-192.png')).toMatchObject({ width: 192, height: 192 });
    expect(pngInfo('public/icon-512.png')).toMatchObject({ width: 512, height: 512 });
  });

  it('packs 16 and 32 px images into the ico', () => {
    const ico = read('public/favicon.ico');
    expect(ico.readUInt16LE(2)).toBe(1); // type: icon
    expect(ico.readUInt16LE(4)).toBe(2); // two images
    expect([ico[6], ico[22]]).toEqual([16, 32]);
  });

  it('names the app in the manifest', () => {
    const manifest = JSON.parse(read('public/site.webmanifest').toString());
    expect(manifest).toMatchObject({ name: 'RSK — React Starter Kit', short_name: 'RSK', display: 'standalone' });
    expect(manifest.icons).toHaveLength(2);
  });
});
