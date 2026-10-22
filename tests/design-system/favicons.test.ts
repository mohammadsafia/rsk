import { existsSync, readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { checkFaviconLinks, NEXT_LAYOUT } from './target-checks';
import { kitTarget } from '../../scripts/lib/kit-target.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(`${ROOT}${path}`);

/** PNG IHDR: width/height at 16/20, colour type at 25 (2 = RGB, 6 = RGBA). */
const pngInfo = (path: string) => {
  const png = read(path);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colourType: png[25] };
};

/** Minimal PNG decoder (8-bit RGB/RGBA, non-interlaced) for pixel checks. */
const decodePng = (path: string) => {
  const png = read(path);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const channels = png[25] === 6 ? 4 : 3;
  const idat: Buffer[] = [];
  for (let pos = 8; pos < png.length;) {
    const length = png.readUInt32BE(pos);
    if (png.toString('ascii', pos + 4, pos + 8) === 'IDAT') idat.push(png.subarray(pos + 8, pos + 8 + length));
    pos += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const value = raw[y * (stride + 1) + 1 + x];
      const a = x >= channels ? out[y * stride + x - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c;
      const predictor = [
        0,
        a,
        b,
        (a + b) >> 1,
        Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c,
      ][filter];
      out[y * stride + x] = (value + predictor) & 255;
    }
  }
  return (fx: number, fy: number) => {
    const offset = Math.floor(fy * height) * stride + Math.floor(fx * width) * channels;
    return [out[offset], out[offset + 1], out[offset + 2]];
  };
};

/** Mark geometry in 32 units: squares at 7..15 and 17..25 (centres 11 and 21). */
const isAccent = ([r, g, b]: number[]) => r > g + 60 && r > b + 40;
const lightness = ([r, g, b]: number[]) => (r + g + b) / 3;

describe('favicon set', () => {
  it('ships every file the manifest and the page head reference (index.html, or a Next app’s root layout)', () => {
    for (const file of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
      expect(existsSync(`${ROOT}public/${file}`), file).toBe(true);
    }
    expect(checkFaviconLinks(ROOT)).toEqual([]);
    const head = read(kitTarget(ROOT) === 'next' ? NEXT_LAYOUT : 'index.html').toString();
    expect(head).not.toMatch(/href=""|logo192|DM\+Sans|Playfair/);
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

  it('draws the mark correctly in every PNG: three squares, an accent square bottom-end, on its tile', () => {
    for (const file of ['public/apple-touch-icon.png', 'public/icon-192.png', 'public/icon-512.png']) {
      const at = decodePng(file);
      expect(isAccent(at(21 / 32, 21 / 32)), `${file} accent square`).toBe(true);
      for (const [x, y] of [
        [11, 11],
        [21, 11],
        [11, 21],
      ])
        expect(isAccent(at(x / 32, y / 32)), `${file} square ${x},${y}`).toBe(false);
      const tile = lightness(at(16 / 32, 16 / 32));
      const square = lightness(at(11 / 32, 11 / 32));
      expect(Math.abs(tile - square), `${file} squares contrast with the tile`).toBeGreaterThan(100);
    }
  });

  it('gives iOS an opaque graphite tile', () => {
    const at = decodePng('public/apple-touch-icon.png');
    expect(lightness(at(0.02, 0.02))).toBeLessThan(40);
    expect(lightness(at(16 / 32, 16 / 32))).toBeLessThan(40);
  });
});
