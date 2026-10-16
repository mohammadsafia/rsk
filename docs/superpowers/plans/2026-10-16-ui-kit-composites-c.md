# UI Kit Composites — SP3 Plan C (landing, logo, docs, bridge) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish SP3, leaving nothing on the legacy bridge.
- Ship the token-based `Logo` and the full favicon set.
- Rebuild the landing page as the "Specimen sheet" (direction B) on real components.
- Move the docs gallery chrome, every MDX page and the gallery demos to tokens, with code blocks rendered LTR.
- Close the SP2 deferred minors owned by Plan C.
- Delete `legacy-tokens.css`, so the forbidden-pattern baseline ends **empty**.

**Architecture:**
- **New component.** `Logo` is a `shared/` component that goes through parent §6.
- **Favicons.** Static files in `public/`, generated from the same 32-unit geometry.
- **Landing page.** Split into section components under `views/home/` (one file per section), composed by `pages/home/HomePage`. Hero stats are computed from the docs registry.
- **Migrations.** Docs and demos move by hand from per-file class maps. Bridge deletion comes last, proven by `tsc -b`, `vp build` and an empty-baseline guard.

**Tech Stack:** React 18, TypeScript 5.9, Tailwind 4.3, CVA, Radix, react-i18next, MDX docs registry (`import.meta.glob`), Vite+ (`vp`), happy-dom + @testing-library/react, playwright-cli (rendering favicons and screenshots).

**Spec:** `docs/superpowers/specs/2026-10-15-ui-kit-composites-design.md` §5 (Plan C), §6 and §7. Its parent spec and the SP2 addendum are binding. Mockup: `.superpowers/brainstorm/43733-1792096913/content/landing-b-full.html`.

## Global Constraints

Everything in SP3 Plans A and B's Global Constraints carries over:
- Real exit codes gate commits.
- Commit trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Semantic tokens only, `Conditional` in JSX, `data-slot` on every part, EN/AR keys in the same commit.
- Direct imports for module-load barrel reads; test helpers in `src/test-utils/`; `P ds:baseline` after every task that removes violations.

Plan C adds:
- **Landing rules (spec §5.1):**
  - Fixed type scale (no `clamp()`, no arbitrary lengths).
  - At most one accent use per section.
  - No gradients, glass or glow.
  - Code, commands and aliases stay `dir="ltr"`.
- **Static assets:** live in `public/`. The guard scans `src/` only, so the favicon SVG may carry literal colours. Those colours are the token values (oklch) copied from `src/styles/tokens.css`.

### Plan decisions not spelled out in the spec (keep them)

- **Logo colours.**
  - Tile: `fill-fg`. Squares: `fill-canvas`. Accent square: `fill-accent`.
  - Because `fg` and `canvas` swap between themes, the tile reads light-on-dark in dark mode and dark-on-light in light mode, which is the spec's "inverted in light", for free.
  - The wordmark is the literal brand "RSK", not `APP_CONFIGURATIONS.APP_NAME` ("Starter"). The spec names RSK, and `home.json` already says `nav.brand = "RSK"`.
- **Favicons without ImageMagick.**
  - PNGs are rendered by playwright from `public/favicon-source.html`, which inlines the mark at each size.
  - `favicon.ico` is packed by a small Python script: an ICO container may hold PNG payloads (Windows Vista and later, every current browser).
  - The source page is deleted after generation; the script stays in `scripts/design-system/` for regeneration.
- **Landing stats** come from `getComponentDocsRegistry()` grouped by `category` (UI, Forms, Shared), plus the total doc count. The registry is synchronous (frontmatter is eager), so the counts are exact at render time without hard-coding. That meets "from the registry at build time".
- **Specimen bento.** The live components are wrapped in a `div` with `inert` (React 18: set via `ref` → `setAttribute('inert', '')`) plus `aria-hidden`. The section gets an `sr-only` description. Nothing in the bento is focusable or announced twice.
- **Old landing deleted.** `views/home/component-showcase/` and every unused `home.json` key go. `techStack.*` and the `showcase.variant*` keys only exist for the deleted sections.
- **`index.html`** drops the stale DM Sans / Playfair font links: fonts load from `src/index.css`, as SP1 set up. `/env.js` stays, because it is runtime config injection outside SP3.

## Review Focus

1. **The empty baseline is real.** Deleting `legacy-tokens.css` must not leave a class that silently resolves to nothing (e.g. `text-muted-foreground` in an MDX string). → Task 10 greps the built CSS for every legacy utility name and fails on any hit. The guard alone only scans for patterns.
2. **The favicon is correct in both schemes and on iOS.** The SVG switches inks with `prefers-color-scheme`; the apple-touch icon is opaque (no black square). → Task 2 asserts no alpha in `apple-touch-icon.png` (IHDR colour type 2) and the media query in the SVG.
3. **The landing in Arabic.** Headings use the Kufi stack with increased leading, the stat numbers stay Western and LTR, and code/aliases/commands stay LTR. → Task 5 tests `dir="ltr"` on every command/alias node, and that `ar` headings get `leading-snug` or looser.
4. **The bento is inert.** No focusable element inside the specimen bento can receive focus, and screen readers get one description, not dozens of fake controls. → Task 4 asserts `inert` + `aria-hidden` and zero tabbable descendants when queried with `:not([inert] *)`.
5. **Code blocks in RTL.** Every docs code block renders LTR, left-aligned, in the mono face, including inline `code` inside Arabic prose. → Task 6 tests `CodeBlock` under `ar`.

---
## File Structure

| File | Responsibility | Task |
|---|---|---|
| `shared/logo/*` (new); `layouts/app-layout`, `layouts/auth-layout` | Token-based Logo and where it is used | 1 |
| `public/*` (new), `index.html`, `scripts/design-system/favicons/*` (new); delete `assets/icons/QuraAI*`; `assets/icons/CertificationIcon.tsx` | Favicon set and asset cleanup | 2 |
| `views/home/{landing-nav,hero}/*` (new), `pages/home/HomePage.tsx`, `locales/*/home.json` | Landing nav, hero and registry stats | 3 |
| `views/home/specimen/*` (new) | Inert specimen bento | 4 |
| `views/home/{features,documented,tooling,structure,get-going,landing-footer}/*` (new); delete `views/home/component-showcase` | Remaining landing sections | 5 |
| `component-docs/code-block/*`, `component-docs/gallery/**`, `pages/components/{ComponentDetailPage,ComponentsGalleryPage}.tsx` | Docs chrome | 6 |
| `scripts/design-system/codemods/migrate-classes.ts` (new); every `*.mdx`; `component-docs/_template/*` | Class codemod and MDX migration | 7 |
| `pages/components/components.data.demos.tsx` | Gallery demos | 8 |
| `ui/{accordion,collapsible,input,calendar}`, `shared/toaster`, `shared/app-shell`, `tests/design-system/contrast.test.ts` | SP2 deferred minors | 9 |
| `styles/legacy-tokens.css` (delete), `index.css`, `lib/constants/DesignTokens.ts`, guard | Bridge deletion and empty baseline | 10 |
| — | Exit gate and four-way screenshots | 11 |

---

### Task 1: `shared/Logo` (mark C · Building block)

**Files:**
- Create: `src/components/shared/logo/Logo.tsx`, `index.ts`, `Logo.test.tsx`; `src/component-docs/shared/Logo.mdx`
- Modify: `src/components/shared/index.ts` (add `./logo`); `src/layouts/app-layout/AppLayout.tsx` (sidebar header brand); `src/layouts/auth-layout/AuthLayout.tsx`

**Interfaces:**
- Produces: `Logo: FC<LogoProps>`, where `LogoProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & { variant?: 'mark' | 'lockup'; size?: 'sm' | 'md' | 'lg'; tagline?: boolean }`.
  - `size`: `sm` = 16px mark, `md` = 24px, `lg` = 32px.
  - `mark` renders `role="img"` with `aria-label="RSK"`.
  - `lockup` hides the svg (`aria-hidden`) and shows the "RSK" wordmark text. `tagline` adds "React Starter Kit" under it.
- Geometry (spec §5.2):
  - viewBox `0 0 32 32`; tile `rect` 32×32, `rx` 8.
  - Squares 8×8 at (7,7), (17,7), (7,17), `rx` 2.5; the accent square at (17,17), `rx` 4.
  - At `size="sm"` the squares are 8.5×8.5 at 6.5/17 (accent `rx` 4.25).
  - In RTL the accent square stays bottom-**inline-end**: the svg mirrors with `rtl:-scale-x-100`. The mark is symmetric except for the accent.

- [ ] **Step 1: Write the failing test**

`src/components/shared/logo/Logo.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Logo } from '@components/shared';

afterEach(cleanup);

const rects = () => [...document.querySelectorAll('[data-slot="logo"] rect')];

describe('Logo', () => {
  it('draws the building-block mark from tokens only', () => {
    render(<Logo />);
    expect(screen.getByRole('img', { name: 'RSK' })).toBeTruthy();
    const [tile, ...squares] = rects();
    expect(tile.getAttribute('class')).toContain('fill-fg');
    expect(squares).toHaveLength(4);
    expect(squares.slice(0, 3).every((square) => square.getAttribute('class')?.includes('fill-canvas'))).toBe(true);
    expect(squares[3].getAttribute('class')).toContain('fill-accent');
    expect(squares[3].getAttribute('rx')).toBe('4');
    expect(document.body.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(/i);
  });

  it('switches to the 16px geometry at size sm and mirrors in RTL', () => {
    render(<Logo size="sm" />);
    const [, first] = rects();
    expect(first.getAttribute('width')).toBe('8.5');
    expect(first.getAttribute('x')).toBe('6.5');
    expect(document.querySelector('[data-slot="logo"] svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
  });

  it('renders the lockup with a visible wordmark and an optional tagline', () => {
    render(<Logo variant="lockup" tagline />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('RSK')).toBeTruthy();
    expect(screen.getByText('React Starter Kit')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/components/shared/logo`
Expected: FAIL. `Logo` is not exported.

- [ ] **Step 3: Implement**

`src/components/shared/logo/Logo.tsx`:

```tsx
import { type ComponentPropsWithoutRef, type FC } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type LogoSize = 'sm' | 'md' | 'lg';

export type LogoProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  variant?: 'mark' | 'lockup';
  size?: LogoSize;
  /** Lockup only: adds "React Starter Kit" under the wordmark. */
  tagline?: boolean;
};

const MARK_SIZE: Record<LogoSize, string> = { sm: 'size-4', md: 'size-6', lg: 'size-8' };
const WORDMARK_SIZE: Record<LogoSize, string> = { sm: 'text-sm', md: 'text-md', lg: 'text-lg' };

/** 32-unit geometry; the 16px mark uses slightly larger squares so they survive rasterising. */
const GEOMETRY = {
  regular: { size: 8, near: 7, far: 17, rx: 2.5, accentRx: 4 },
  small: { size: 8.5, near: 6.5, far: 17, rx: 2.5, accentRx: 4.25 },
} as const;

const Mark: FC<{ size: LogoSize; labelled: boolean }> = ({ size, labelled }) => {
  const g = size === 'sm' ? GEOMETRY.small : GEOMETRY.regular;

  return (
    <svg
      viewBox="0 0 32 32"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? 'RSK' : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn('shrink-0 rtl:-scale-x-100', MARK_SIZE[size])}
    >
      <rect width="32" height="32" rx="8" className="fill-fg" />
      <rect x={g.near} y={g.near} width={g.size} height={g.size} rx={g.rx} className="fill-canvas" />
      <rect x={g.far} y={g.near} width={g.size} height={g.size} rx={g.rx} className="fill-canvas" />
      <rect x={g.near} y={g.far} width={g.size} height={g.size} rx={g.rx} className="fill-canvas" />
      <rect x={g.far} y={g.far} width={g.size} height={g.size} rx={g.accentRx} className="fill-accent" />
    </svg>
  );
};

const Logo: FC<LogoProps> = ({ variant = 'mark', size = 'md', tagline = false, className, ...props }) => (
  <span data-slot="logo" className={cn('inline-flex items-center gap-2', className)} {...props}>
    <Mark size={size} labelled={variant === 'mark'} />

    <Conditional.If condition={variant === 'lockup'}>
      <span className="flex flex-col leading-none">
        <span className={cn('text-fg font-semibold tracking-tight', WORDMARK_SIZE[size])}>RSK</span>

        <Conditional.If condition={tagline}>
          <span className="text-fg-muted text-2xs mt-1">React Starter Kit</span>
        </Conditional.If>
      </span>
    </Conditional.If>
  </span>
);

Logo.displayName = 'Logo';

export default Logo;
```

`index.ts`: `export { default as Logo, type LogoProps } from './Logo';`. Add `export * from './logo';` to `shared/index.ts`.

"RSK" and "React Starter Kit" are brand names: identical in both languages, never translated.

- [ ] **Step 4: Use it**

In `AppLayout.tsx` `AppSidebar`, the brand block becomes:

```tsx
        <div className={cn('flex min-w-0 items-center', collapsed && 'md:hidden')}>
          <Logo variant="lockup" size="md" />
        </div>
```

Drop the `APP_CONFIGURATIONS` import if it becomes unused. The AppLayout test still passes: it does not assert the brand text.

In `AuthLayout.tsx`, the `main` becomes:

```tsx
      <main className="bg-canvas text-fg flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
        <Logo variant="lockup" size="lg" tagline />

        <Outlet />
      </main>
```

Import `Logo` from `@components/shared` (merge with the `Toaster` import).

- [ ] **Step 5: Docs**

`src/component-docs/shared/Logo.mdx` (`id: logo`, `category: Shared`):
- **Demo:** the three mark sizes in a row; the lockup at `md`; the lockup with `tagline` at `lg`; a `bg-fg` swatch box containing the mark, to show that it reads on an inverted surface.
- **API table:** `variant`, `size`, `tagline`.
- **Note:** the accent square is the only accent on any surface that shows the logo; do not place the logo on an accent background.

- [ ] **Step 6: Run tests and commit**

```bash
P exec vp test --run src/components/shared/logo src/layouts && P exec tsc -b && P docs:lint && \
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(shared): Logo (building-block mark and RSK lockup) from tokens; used in the sidebar and auth layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Favicon set, `index.html`, retire the QuraAI assets

**Files:**
- Create: `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/site.webmanifest`
- Create: `scripts/design-system/favicons/render.js` (playwright run-code script), `scripts/design-system/favicons/pack-ico.py`, `scripts/design-system/favicons/README.md`
- Create: `tests/design-system/favicons.test.ts`
- Modify: `index.html`
- Delete: `src/assets/icons/QuraAILogo.tsx`, `src/assets/icons/QuraAILoader.tsx` (and their `index.ts` lines)
- Modify: `src/assets/icons/CertificationIcon.tsx` (hex → `currentColor`)

**Interfaces:**
- Consumes: Task 1's geometry (same numbers).
- The favicon-gen skill (`~/.claude/skills/favicon-gen`) is the reference for the file set and HTML tags. Its ImageMagick step is replaced by playwright rendering (no ImageMagick on this machine).

- [ ] **Step 1: Write the failing test**

`tests/design-system/favicons.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run tests/design-system/favicons.test.ts`
Expected: FAIL. `public/` does not exist.

- [ ] **Step 3: Author the SVG and the manifest**

`public/favicon.svg`. The ink values are the `--fg` / `--canvas` / `--accent` values from `src/styles/tokens.css`; copy them exactly with `grep -n "^\s*--fg:\|^\s*--canvas:\|^\s*--accent:" src/styles/tokens.css`. Dark scheme is the default, as in the app.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    .tile { fill: oklch(0.928 0.003 264.5); }
    .sq { fill: oklch(0.173 0.004 264.5); }
    .ac { fill: oklch(0.698 0.125 12); }
    @media (prefers-color-scheme: light) {
      .tile { fill: oklch(0.205 0.006 271.1); }
      .sq { fill: oklch(0.991 0.001 286.4); }
      .ac { fill: oklch(0.43 0.141 14.9); }
    }
  </style>
  <rect class="tile" width="32" height="32" rx="8"/>
  <rect class="sq" x="7" y="7" width="8" height="8" rx="2.5"/>
  <rect class="sq" x="17" y="7" width="8" height="8" rx="2.5"/>
  <rect class="sq" x="7" y="17" width="8" height="8" rx="2.5"/>
  <rect class="ac" x="17" y="17" width="8" height="8" rx="4"/>
</svg>
```

Check the copied values against `tokens.css` and use the file's numbers if they differ from the mockup's numbers above.

`public/site.webmanifest`:

```json
{
  "name": "RSK — React Starter Kit",
  "short_name": "RSK",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#1b1c1f",
  "background_color": "#1b1c1f",
  "display": "standalone"
}
```

The manifest needs sRGB hex (oklch is not accepted there). `#1b1c1f` is `--canvas` dark (oklch 0.173 0.004 264.5) converted. Verify with a converter in Step 4's script (it prints the sRGB of the canvas pixel it renders) and use that value.

- [ ] **Step 4: Render the PNGs and pack the ICO**

`scripts/design-system/favicons/render.js` (run with `playwright-cli run-code --filename=…`):

```js
async page => {
  const root = '/Users/mohammadsafia/Desktop/projects/rsk/public/';
  const svg = (size, opaque) => {
    const g = size <= 16 ? { s: 8.5, n: 6.5, f: 17, ac: 4.25 } : { s: 8, n: 7, f: 17, ac: 4 };
    const pad = opaque ? `<rect width="32" height="32" fill="oklch(0.173 0.004 264.5)"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">${pad}
      <rect width="32" height="32" rx="${opaque ? 0 : 8}" fill="oklch(0.928 0.003 264.5)"/>
      <rect x="${g.n}" y="${g.n}" width="${g.s}" height="${g.s}" rx="2.5" fill="oklch(0.173 0.004 264.5)"/>
      <rect x="${g.f}" y="${g.n}" width="${g.s}" height="${g.s}" rx="2.5" fill="oklch(0.173 0.004 264.5)"/>
      <rect x="${g.n}" y="${g.f}" width="${g.s}" height="${g.s}" rx="2.5" fill="oklch(0.173 0.004 264.5)"/>
      <rect x="${g.f}" y="${g.f}" width="${g.s}" height="${g.s}" rx="${g.ac}" fill="oklch(0.698 0.125 12)"/></svg>`;
  };
  const shoot = async (size, file, opaque) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0">${svg(size, opaque)}</body>`);
    await page.screenshot({ path: root + file, omitBackground: !opaque, clip: { x: 0, y: 0, width: size, height: size } });
  };
  await shoot(16, 'icon-16.png', false);
  await shoot(32, 'icon-32.png', false);
  await shoot(180, 'apple-touch-icon.png', true);
  await shoot(192, 'icon-192.png', false);
  await shoot(512, 'icon-512.png', false);
  return 'ok';
}
```

For the apple-touch icon, the tile fills the square (`rx` 0) on an opaque canvas background. iOS applies its own mask, and a transparent corner would render black.

Playwright writes RGBA PNGs even when opaque, so the test's `colourType: 2` needs the alpha channel dropped. `pack-ico.py` does that too, with no third-party imports. It decodes the PNG with `zlib`, strips alpha, re-encodes, and packs the ICO:

```python
"""Pack icon-16/32.png into favicon.ico and rewrite apple-touch-icon.png as opaque RGB. Stdlib only."""
import struct, sys, zlib
from pathlib import Path

PUBLIC = Path(sys.argv[1] if len(sys.argv) > 1 else 'public')

def read_png(path):
    data = path.read_bytes()
    pos, chunks = 8, []
    while pos < len(data):
        length, kind = struct.unpack('>I4s', data[pos:pos + 8])
        chunks.append((kind, data[pos + 8:pos + 8 + length]))
        pos += 12 + length
    ihdr = dict(chunks)[b'IHDR']
    width, height, depth, colour = struct.unpack('>IIBB', ihdr[:10])
    raw = zlib.decompress(b''.join(body for kind, body in chunks if kind == b'IDAT'))
    return width, height, depth, colour, raw

def unfilter(width, height, bpp, raw):
    stride, rows, prev, pos = width * bpp, [], bytearray(width * bpp), 0
    for _ in range(height):
        ftype, line = raw[pos], bytearray(raw[pos + 1:pos + 1 + stride])
        pos += 1 + stride
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            b, c = prev[i], prev[i - bpp] if i >= bpp else 0
            if ftype == 1: line[i] = (line[i] + a) & 255
            elif ftype == 2: line[i] = (line[i] + b) & 255
            elif ftype == 3: line[i] = (line[i] + (a + b) // 2) & 255
            elif ftype == 4:
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[i] = (line[i] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line); prev = line
    return rows

def write_png(path, width, height, colour, rows):
    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body) & 0xFFFFFFFF)
    raw = b''.join(b'\x00' + bytes(row) for row in rows)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, colour, 0, 0, 0))
                     + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

# apple-touch-icon: RGBA -> RGB
w, h, depth, colour, raw = read_png(PUBLIC / 'apple-touch-icon.png')
assert depth == 8 and colour == 6, (depth, colour)
rgba = unfilter(w, h, 4, raw)
rgb = [bytearray(b for i in range(w) for b in row[i * 4:i * 4 + 3]) for row in rgba]
write_png(PUBLIC / 'apple-touch-icon.png', w, h, 2, rgb)
print('canvas pixel sRGB: #%02x%02x%02x' % tuple(rgb[0][0:3]))

# favicon.ico with PNG payloads (16, 32)
images = [(16, (PUBLIC / 'icon-16.png').read_bytes()), (32, (PUBLIC / 'icon-32.png').read_bytes())]
header = struct.pack('<HHH', 0, 1, len(images))
offset, entries = 6 + 16 * len(images), b''
for size, png in images:
    entries += struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(png), offset)
    offset += len(png)
(PUBLIC / 'favicon.ico').write_bytes(header + entries + b''.join(png for _, png in images))
for size, _ in images:
    (PUBLIC / f'icon-{size}.png').unlink()
print('wrote favicon.ico (16, 32) and opaque apple-touch-icon.png')
```

Run:

```bash
mkdir -p public && playwright-cli open about:blank && \
playwright-cli run-code --filename=scripts/design-system/favicons/render.js && \
python3 -I scripts/design-system/favicons/pack-ico.py public
```

Expected: `"ok"`, then `canvas pixel sRGB: #xxxxxx` and the "wrote" line. Put the printed hex into `site.webmanifest` (`theme_color` / `background_color`) and into the dark `theme-color` meta below. Then render one light pixel the same way (or convert `--canvas` light by hand) for the light meta. Ledger the values.

`scripts/design-system/favicons/README.md`: three lines on how to regenerate (the two commands above), and a note that the geometry must match `shared/Logo`.

- [ ] **Step 5: `index.html`**

Replace the `<head>` content from the font links through the apple-touch line:

```html
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="/env.js" type="text/javascript"></script>
    <meta name="description" content="A considered React + TypeScript + Vite starter for developers who value craft." />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1b1c1f" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fcfcfd" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <title>RSK — React Starter Kit</title>
```

Use the hex values Step 4 printed. The font `<link>`s and preconnects are removed: `src/index.css` already imports Schibsted Grotesk, Spline Sans Mono and Noto Kufi Arabic.

- [ ] **Step 6: Asset cleanup**

```bash
git rm -q src/assets/icons/QuraAILogo.tsx src/assets/icons/QuraAILoader.tsx
sed -i '' '/QuraAI/d' src/assets/icons/index.ts
grep -rn "QuraAI" src   # must print nothing
grep -n "#[0-9a-fA-F]\{3,8\}" src/assets/icons/CertificationIcon.tsx
```

In `CertificationIcon.tsx`, replace each hex `fill`/`stroke` with `currentColor`. Callers set the colour with a `text-*` class. Then:
- `grep -rn "CertificationIcon" src --include='*.tsx'`. For each caller with no text colour, add `className="text-fg-muted"`.

- [ ] **Step 7: Run tests and commit**

```bash
P exec vp test --run tests/design-system src && P exec tsc -b && P exec vp build > $WS/build.log 2>&1 && \
P ds:baseline && P exec vp check && \
git add -A public index.html scripts src tests && git commit -m "feat(brand): favicon set (svg, ico, apple-touch, PWA icons, manifest) and index.html links; retire QuraAI assets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Landing — nav, hero and registry stats

**Files:**
- Create: `src/views/home/landing-stats.ts`, `src/views/home/landing-stats.test.ts`
- Create: `src/views/home/landing-nav/LandingNav.tsx`, `src/views/home/hero/Hero.tsx`, `src/views/home/index.ts`
- Create: `src/pages/home/HomePage.test.tsx`
- Modify: `src/pages/home/HomePage.tsx` (rewritten as a composition; sections from Tasks 4–5 slot in later)
- Modify: `src/locales/{en,ar}/home.json`

**Interfaces:**
- Produces:
  - `countDocs(entries: ReadonlyArray<{ category: string }>): { ui: number; forms: number; shared: number; total: number }`. A pure function that uses `normalizeCategoryKey`.
  - `LandingNav` and `Hero`.
  - `views/home/index.ts` re-exports every landing section; HomePage imports from `@views/home` (check `grep -n "@views" tsconfig.app.json`, or use a relative path).
- Keys:
  - `home.nav.{docs, cli, getStarted, primary}`
  - `home.hero.*` (exists)
  - `home.stats.{uiComponents, formComponents, sharedComponents, mdxDocs}` (exist)
  - `home.hero.subtitle` uses `{{count}}`, the total UI + Forms + Shared component docs, instead of the hard-coded "76"

- [ ] **Step 1: Write the failing tests**

`src/views/home/landing-stats.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { getComponentDocsRegistry } from '@/component-docs/registry';

import { countDocs } from './landing-stats';

describe('countDocs', () => {
  it('groups by normalised category and counts every doc', () => {
    expect(countDocs([{ category: 'UI' }, { category: 'ui' }, { category: 'Forms' }, { category: 'Shared' }, { category: 'Hooks' }])).toEqual({
      ui: 2,
      forms: 1,
      shared: 1,
      total: 5,
    });
  });

  it('matches the real registry, so the hero never drifts from the docs', () => {
    const counts = countDocs(getComponentDocsRegistry());
    expect(counts.total).toBe(getComponentDocsRegistry().length);
    expect(counts.ui).toBeGreaterThan(30);
  });
});
```

Check the registry import path. The docs pages import it as `@component-docs/registry` or a relative path: `grep -rn "component-docs/registry" src --include='*.tsx' | head -2`. Use the same specifier.

`src/pages/home/HomePage.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { ThemeProvider } from '@contexts';

import HomePage from './HomePage';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const renderHome = () =>
  render(
    <ThemeProvider>
      <Tooltip.Provider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </Tooltip.Provider>
    </ThemeProvider>,
  );

describe('HomePage', () => {
  it('has a sticky nav with the logo lockup and one level-1 heading with the accent word', () => {
    renderHome();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav.closest('header')?.className).toContain('sticky');
    expect(nav.closest('header')?.querySelector('[data-slot="logo"]')).not.toBeNull();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.querySelector('.text-accent')?.textContent).toBe('next');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows registry counts in mono LTR stat cells', () => {
    renderHome();
    const cells = [...document.querySelectorAll('[data-slot="landing-stat"] [data-slot="landing-stat-value"]')];
    expect(cells).toHaveLength(4);
    cells.forEach((cell) => {
      expect(cell.getAttribute('dir')).toBe('ltr');
      expect(cell.className).toContain('font-mono');
      expect(Number(cell.textContent)).toBeGreaterThan(0);
    });
  });

  it('uses the Kufi-friendly leading on Arabic headings and no legacy classes', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderHome();
    expect(screen.getByRole('heading', { level: 1 }).className).toMatch(/rtl:leading-snug|leading-snug/);
    expect(document.body.innerHTML).not.toMatch(/text-muted-foreground|bg-primary|text-primary(?!-)|\[\d+px\]|tracking-\[/);
  });
});
```

- [ ] **Step 2: Run them**

Run: `P exec vp test --run src/views/home src/pages/home`
Expected: FAIL. `landing-stats` does not exist, the nav has no `Primary` label, and the page has legacy classes.

- [ ] **Step 3: Keys**

Add to `home.json`:
- EN: `"nav": { …existing, "primary": "Primary", "docs": "Docs", "cli": "CLI", "getStarted": "Get Started" }`
- AR: `"primary": "الرئيسية", "docs": "التوثيق", "cli": "سطر الأوامر", "getStarted": "ابدأ الآن"`

Change `hero.subtitle`:
- EN: `"A considered starter for developers who value craft. {{count}} components, enterprise patterns, and zero compromise — wired together so you can ship on day one."`
- AR: `"نقطة انطلاق مدروسة للمطوّرين الذين يقدّرون الإتقان. {{count}} مكوّنًا، وأنماط مؤسسية — جاهزة لتطلق منتجك من اليوم الأول."`

- [ ] **Step 4: Implement**

`src/views/home/landing-stats.ts`:

```ts
import { normalizeCategoryKey } from '@/component-docs/registry';

export type LandingCounts = { ui: number; forms: number; shared: number; total: number };

export const countDocs = (entries: ReadonlyArray<{ category: string }>): LandingCounts => {
  const counts: LandingCounts = { ui: 0, forms: 0, shared: 0, total: entries.length };

  for (const { category } of entries) {
    const key = normalizeCategoryKey(category);
    if (key === 'UI') counts.ui += 1;
    else if (key === 'FORMS') counts.forms += 1;
    else if (key === 'SHARED') counts.shared += 1;
  }

  return counts;
};
```

`src/views/home/landing-nav/LandingNav.tsx`:

```tsx
import { Link } from 'react-router-dom';

import { Button } from '@components/ui';
import { LanguageSwitcher, Logo, ThemeSwitcher } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

const LINK = 'text-fg-muted hover:text-fg rounded-sm text-sm transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

function LandingNav() {
  const { t } = useAppTranslation('home');

  return (
    <header data-slot="landing-nav" className="bg-canvas/95 border-border-subtle sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Link to={FULL_ROUTES_PATH.HOME.INDEX} aria-label={t('nav.brand')} className="rounded-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none">
          <Logo variant="lockup" size="sm" />
        </Link>

        <nav aria-label={t('nav.primary')} className="hidden items-center gap-5 md:flex">
          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX} className={LINK}>
            {t('nav.components')}
          </Link>

          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX} className={LINK}>
            {t('nav.docs')}
          </Link>

          <a href="#tooling" className={LINK}>
            {t('nav.cli')}
          </a>
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <LanguageSwitcher />

          <ThemeSwitcher />

          <Button size="sm" asChild className="ms-2">
            <Link to={FULL_ROUTES_PATH.HOME.DASHBOARD}>{t('nav.getStarted')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default LandingNav;
```

The nav `<nav>` is `hidden` below `md`. The test queries it by role, which happy-dom resolves regardless of CSS. Mobile users still have the logo, switches and Get Started.

`src/views/home/hero/Hero.tsx`:

```tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';
import { getComponentDocsRegistry } from '@/component-docs/registry';

import { countDocs } from '../landing-stats';

function Hero() {
  const { t } = useAppTranslation('home');
  const counts = useMemo(() => countDocs(getComponentDocsRegistry()), []);

  const stats = [
    { value: counts.ui, label: t('stats.uiComponents') },
    { value: counts.forms, label: t('stats.formComponents') },
    { value: counts.shared, label: t('stats.sharedComponents') },
    { value: counts.total, label: t('stats.mdxDocs') },
  ];

  return (
    <section data-slot="landing-hero" aria-labelledby="landing-hero-title" className="mx-auto max-w-6xl px-4 pt-16 text-center md:px-6 md:pt-24">
      <p className="text-fg-muted font-mono text-xs font-medium tracking-wider uppercase">{t('hero.eyebrow')}</p>

      <h1 id="landing-hero-title" className="text-fg mx-auto mt-4 max-w-[18ch] text-4xl font-semibold tracking-tight md:text-5xl rtl:leading-snug">
        {t('hero.titleLead')}
        <span className="text-accent">{t('hero.titleEmphasis')}</span>
        {t('hero.titleTrail')}
      </h1>

      <p className="text-fg-muted mx-auto mt-4 max-w-prose text-base">{t('hero.subtitle', { count: counts.ui + counts.forms + counts.shared })}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link to={FULL_ROUTES_PATH.HOME.DASHBOARD}>{t('hero.ctaPrimary')}</Link>
        </Button>

        <Button size="lg" variant="outline" asChild>
          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX}>{t('hero.ctaSecondary')}</Link>
        </Button>
      </div>

      <dl className="border-border-subtle mt-12 grid grid-cols-2 border-y text-start md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} data-slot="landing-stat" className="border-border-subtle flex flex-col-reverse gap-1 border-e px-5 py-4 last:border-e-0 max-md:nth-2:border-e-0">
            <dt className="text-fg-muted text-sm">{stat.label}</dt>

            <dd data-slot="landing-stat-value" dir="ltr" className="text-fg text-start font-mono text-2xl font-medium tabular-nums rtl:text-end">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default Hero;
```

On `max-w-[18ch]`: the guard's `arbitrary-length` pattern matches only `px`/`rem`, so `ch` passes. It is the mockup's measure. If `P ds:baseline` refuses, use `max-w-xl`.

`text-5xl` is on Tailwind's fixed scale. Check that the theme defines `--text-4xl` and `--text-5xl` (`grep -n "text-4xl\|text-5xl" src/styles/theme.css`). If the theme clears them (`--text-*: initial`), use `text-2xl md:text-3xl` (the largest defined steps) and ledger it.

`src/views/home/index.ts`:

```ts
export { default as LandingNav } from './landing-nav/LandingNav';
export { default as Hero } from './hero/Hero';
```

`src/pages/home/HomePage.tsx`, replaced wholesale (Tasks 4–5 add sections):

```tsx
import { Hero, LandingNav } from '@views/home';

function HomePage() {
  return (
    <div data-slot="landing" className="bg-canvas text-fg min-h-dvh">
      <LandingNav />

      <main>
        <Hero />
      </main>
    </div>
  );
}

export default HomePage;
```

The old HomePage's `framer-motion` entrance animations go away with it (an instrument, not a show).
- Check whether `framer-motion` has other users: `grep -rn "framer-motion" src`.
- If none, leave the dependency for now and note it in the ledger. Removing a dependency is outside this plan's scope.

- [ ] **Step 5: Run tests and commit**

```bash
P exec vp test --run src/views src/pages/home tests/i18n && P exec tsc -b && \
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(home): landing nav, hero and registry-driven stats (specimen-sheet direction)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Landing — inert specimen bento

**Files:**
- Create: `src/views/home/specimen/Specimen.tsx`, `src/views/home/specimen/Specimen.test.tsx`
- Modify: `src/views/home/index.ts`, `src/pages/home/HomePage.tsx`, `src/locales/{en,ar}/home.json` (`specimen.*`)

**Interfaces:**
- Consumes: `CalendarEvent` (`tone`), the field family (`Input`, `TimePicker` or `Select` trigger, `FormField`-style inline error markup), `Tag` (`tone`), `Table` (`numeric`, `data-state="selected"`), `Toast` (inline viewport), `Card` + `Button` (confirm panel).
- Produces: `Specimen`, a section with an `sr-only` description and an inert, `aria-hidden` visual grid.

- [ ] **Step 1: Write the failing test**

`src/views/home/specimen/Specimen.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import Specimen from './Specimen';

import '../../../i18n';

afterEach(cleanup);

describe('Specimen bento', () => {
  it('describes itself once and hides the live specimens from assistive tech and focus', () => {
    render(
      <Tooltip.Provider>
        <Specimen />
      </Tooltip.Provider>,
    );
    const section = screen.getByRole('region', { name: 'Component specimens' });
    expect(section.querySelector('.sr-only')?.textContent).toMatch(/calendar|table/i);
    const grid = section.querySelector('[data-slot="specimen-grid"]') as HTMLElement;
    expect(grid.hasAttribute('inert')).toBe(true);
    expect(grid.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the real primitives', () => {
    render(
      <Tooltip.Provider>
        <Specimen />
      </Tooltip.Provider>,
    );
    for (const slot of ['calendar-event', 'tag', 'table', 'toast', 'input']) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(document.querySelector('[data-slot="table"] [data-state="selected"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="table"] [data-numeric="true"]')?.textContent).toMatch(/\d/);
    expect(document.querySelector('[aria-invalid="true"]')).not.toBeNull();
  });
});
```

Check each primitive's root `data-slot` name (`grep -n 'data-slot="' src/components/ui/{calendar-event,tag,table,toast,input}/*.tsx | head`). If one differs (e.g. `toast` vs `toast-root`), use the real name and ledger a ruling.

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/views/home/specimen`
Expected: FAIL. `./Specimen` does not exist.

- [ ] **Step 3: Keys**

EN `home.json`:

```json
  "specimen": {
    "label": "Component specimens",
    "description": "A live sample of the kit: a day calendar with tinted events and the current-time line, a time field and an email field with an inline error, status tags, an invoice table with a selected row, a success toast and a delete confirmation.",
    "calendar": "Calendar · Tue 13",
    "fields": "Field family",
    "status": "Status",
    "table": "Table",
    "rows": "1–10 of 248",
    "events": { "checkup": "Check-up · L. Haddad", "consult": "Surgery consult", "lab": "Lab review", "insurance": "Insurance call" },
    "selectTime": "Select time",
    "emailError": "Enter a complete email",
    "tags": { "active": "Active", "pending": "Pending", "urgent": "Urgent", "cardiology": "Cardiology" },
    "columns": { "invoice": "Invoice", "patient": "Patient", "amount": "Amount" },
    "toastTitle": "Appointment booked",
    "toastBody": "Tue 13 Oct · 10:30",
    "confirmTitle": "Delete record?",
    "confirmBody": "This can't be undone.",
    "cancel": "Cancel",
    "delete": "Delete"
  },
```

AR:

```json
  "specimen": {
    "label": "نماذج المكوّنات",
    "description": "عيّنة حيّة من المجموعة: تقويم يومي بأحداث ملوّنة وخط الوقت الحالي، وحقل وقت وحقل بريد إلكتروني مع خطأ ظاهر، ووسوم حالة، وجدول فواتير بصف محدد، وإشعار نجاح، وتأكيد حذف.",
    "calendar": "التقويم · الثلاثاء 13",
    "fields": "عائلة الحقول",
    "status": "الحالة",
    "table": "الجدول",
    "rows": "1–10 من 248",
    "events": { "checkup": "فحص دوري · ل. حداد", "consult": "استشارة جراحية", "lab": "مراجعة المختبر", "insurance": "اتصال التأمين" },
    "selectTime": "اختر الوقت",
    "emailError": "أدخل بريدًا إلكترونيًا كاملًا",
    "tags": { "active": "نشط", "pending": "قيد الانتظار", "urgent": "عاجل", "cardiology": "أمراض القلب" },
    "columns": { "invoice": "الفاتورة", "patient": "المريض", "amount": "المبلغ" },
    "toastTitle": "تم حجز الموعد",
    "toastBody": "الثلاثاء 13 أكتوبر · 10:30",
    "confirmTitle": "حذف السجل؟",
    "confirmBody": "لا يمكن التراجع عن هذا الإجراء.",
    "cancel": "إلغاء",
    "delete": "حذف"
  },
```

- [ ] **Step 4: Implement**

`src/views/home/specimen/Specimen.tsx`:

```tsx
import { useEffect, useRef } from 'react';

import { Button, CalendarEvent, Card, Input, Table, Tag, Toast } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { AlertTriangle, Clock } from 'lucide-react';

const PANEL = 'bg-surface border-border min-w-0 rounded-lg border p-4';
const EYEBROW = 'text-fg-muted font-mono text-2xs font-medium tracking-wider uppercase';

function Specimen() {
  const { t } = useAppTranslation('home');
  const gridRef = useRef<HTMLDivElement>(null);

  // React 18 does not know the `inert` prop; set the attribute directly.
  useEffect(() => {
    gridRef.current?.setAttribute('inert', '');
  }, []);

  return (
    <section data-slot="landing-specimen" aria-label={t('specimen.label')} className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <p className="sr-only">{t('specimen.description')}</p>

      <div ref={gridRef} aria-hidden="true" data-slot="specimen-grid" className="grid gap-3 md:grid-cols-3">
        <div className={`${PANEL} md:row-span-2`}>
          <div className="mb-3 flex items-center justify-between">
            <span className={EYEBROW}>{t('specimen.calendar')}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <CalendarEvent tone="info">
              <span dir="ltr" className="font-mono tabular-nums">09:00</span> · {t('specimen.events.checkup')}
            </CalendarEvent>

            <CalendarEvent tone="accent">
              <span dir="ltr" className="font-mono tabular-nums">10:30</span> · {t('specimen.events.consult')}
            </CalendarEvent>

            <div className="border-accent relative my-1.5 border-t">
              <span className="bg-accent absolute -top-1 -start-1 size-2 rounded-full" />
            </div>

            <CalendarEvent tone="success">
              <span dir="ltr" className="font-mono tabular-nums">13:00</span> · {t('specimen.events.lab')}
            </CalendarEvent>

            <CalendarEvent tone="warning">
              <span dir="ltr" className="font-mono tabular-nums">15:00</span> · {t('specimen.events.insurance')}
            </CalendarEvent>
          </div>
        </div>

        <div className={PANEL}>
          <span className={EYEBROW}>{t('specimen.fields')}</span>

          <div className="mt-3 flex flex-col gap-2">
            <div className="border-border-strong bg-surface text-fg-muted h-control-md flex items-center gap-2 rounded-md border px-3 text-sm">
              <Clock aria-hidden="true" className="size-4" />
              {t('specimen.selectTime')}
            </div>

            <Input size="md" defaultValue="layla@" aria-invalid="true" dir="ltr" readOnly />

            <p className="text-danger flex items-center gap-1 text-xs">
              <AlertTriangle aria-hidden="true" className="size-3.5" />
              {t('specimen.emailError')}
            </p>
          </div>
        </div>

        <div className={PANEL}>
          <span className={EYEBROW}>{t('specimen.status')}</span>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Tag tone="success">{t('specimen.tags.active')}</Tag>
            <Tag tone="warning">{t('specimen.tags.pending')}</Tag>
            <Tag tone="accent">{t('specimen.tags.urgent')}</Tag>
            <Tag>{t('specimen.tags.cardiology')}</Tag>
          </div>
        </div>

        <div className={`${PANEL} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <span className={EYEBROW}>{t('specimen.table')}</span>

            <span dir="ltr" className="text-fg-subtle font-mono text-xs tabular-nums">
              {t('specimen.rows')}
            </span>
          </div>

          <Table className="mt-2">
            <Table.Header>
              <Table.Row>
                <Table.Head>{t('specimen.columns.invoice')}</Table.Head>
                <Table.Head>{t('specimen.columns.patient')}</Table.Head>
                <Table.Head numeric>{t('specimen.columns.amount')}</Table.Head>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              <Table.Row>
                <Table.Cell><span dir="ltr" className="font-mono tabular-nums">INV-2026-0142</span></Table.Cell>
                <Table.Cell>Layla Haddad</Table.Cell>
                <Table.Cell numeric>1,240.50</Table.Cell>
              </Table.Row>

              <Table.Row data-state="selected">
                <Table.Cell><span dir="ltr" className="font-mono tabular-nums">INV-2026-0143</span></Table.Cell>
                <Table.Cell>Omar Nasser</Table.Cell>
                <Table.Cell numeric>87.00</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </div>

        <div className="md:col-span-1">
          <Toast.Provider>
            <Toast open tone="success" duration={Infinity}>
              <Toast.Icon tone="success" />
              <div className="grid gap-0.5">
                <Toast.Title>{t('specimen.toastTitle')}</Toast.Title>
                <Toast.Description>{t('specimen.toastBody')}</Toast.Description>
              </div>
            </Toast>

            <Toast.Viewport className="static inset-auto m-0 w-full max-w-none p-0" />
          </Toast.Provider>
        </div>

        <Card className="shadow-raised md:col-span-2">
          <Card.Content className="flex flex-col gap-1">
            <p className="text-fg text-sm font-semibold">{t('specimen.confirmTitle')}</p>

            <p className="text-fg-muted text-sm">{t('specimen.confirmBody')}</p>

            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="outline">{t('specimen.cancel')}</Button>
              <Button size="sm" tone="danger">{t('specimen.delete')}</Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}

export default Specimen;
```

Two checks:
- The `Toast` composition must match Toast's real parts (`grep -n "Toast\.\w* =" src/components/ui/toast/Toast.tsx`: Icon, Title, Description, Close, Action exist). If `Toast.Viewport`'s `position` variant forces `fixed`, the `static` override wins through `cn` (tailwind-merge). Confirm visually in Task 11.
- Does `Button` take `tone="danger"`? (SP2: `tone` neutral/accent/danger.) Check `grep -n "danger" src/components/ui/button/Button.tsx`.

Add `export { default as Specimen } from './specimen/Specimen';` to `views/home/index.ts`. In HomePage, `<Specimen />` goes after `<Hero />`.

- [ ] **Step 5: Run tests and commit**

```bash
P exec vp test --run src/views src/pages/home tests/i18n && P exec tsc -b && \
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "feat(home): inert specimen bento rendered from the real primitives

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Landing — features, documented, tooling, structure, get going, footer; delete the old landing

**Files:**
- Create: `src/views/home/features/Features.tsx`, `documented/Documented.tsx`, `tooling/Tooling.tsx`, `structure/Structure.tsx`, `get-going/GetGoing.tsx`, `landing-footer/LandingFooter.tsx`, `section/Section.tsx` (shared eyebrow + h2 wrapper)
- Create: `src/views/home/sections.test.tsx`
- Modify: `src/views/home/index.ts`, `src/pages/home/HomePage.tsx`, `src/locales/{en,ar}/home.json`
- Delete: `src/views/home/component-showcase/` and any `home.json` keys left unused (the `techStack.*` and `showcase.variant*`/`showcase.searchPlaceholder` keys)

**Interfaces:**
- Produces:
  - `Section({ id?, eyebrow, title, children, className })`: a `section` with `aria-labelledby` set to its `h2`, a top hairline, and the eyebrow in mono uppercase.
  - Six section components, composed in HomePage in spec order: Hero, Specimen, Features, Documented, Tooling (`id="tooling"`), Structure, GetGoing, then LandingFooter.
- LTR rule: the terminal log, the alias grid and every command carry `dir="ltr"` and `text-start`. They are code, not prose.

- [ ] **Step 1: Write the failing test**

`src/views/home/sections.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { Documented, Features, GetGoing, LandingFooter, Structure, Tooling } from '@views/home';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const renderAll = () =>
  render(
    <Tooltip.Provider>
      <MemoryRouter>
        <Features />
        <Documented />
        <Tooling />
        <Structure />
        <GetGoing />
        <LandingFooter />
      </MemoryRouter>
    </Tooltip.Provider>,
  );

describe('landing sections', () => {
  it('labels every section with its h2', () => {
    renderAll();
    for (const name of ['Everything wired, nothing in your way.', 'See exactly what you get.', "Generate, don't write.", 'Organized by design.', 'Up and running in seconds.']) {
      const heading = screen.getByRole('heading', { level: 2, name });
      expect(heading.closest('section')?.getAttribute('aria-labelledby')).toBe(heading.id);
    }
  });

  it('numbers the six features in mono', () => {
    renderAll();
    const numbers = [...document.querySelectorAll('[data-slot="landing-feature"] [data-slot="landing-feature-number"]')].map((node) => node.textContent);
    expect(numbers).toEqual(['01', '02', '03', '04', '05', '06']);
  });

  it('keeps code, commands and aliases left-to-right in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderAll();
    const code = document.querySelectorAll('[data-slot="landing-terminal"], [data-slot="landing-alias"], [data-slot="landing-command"]');
    expect(code.length).toBeGreaterThanOrEqual(1 + 6 + 3);
    code.forEach((node) => expect(node.getAttribute('dir')).toBe('ltr'));
  });

  it('copies a command', async () => {
    const writes: string[] = [];
    Object.assign(navigator, { clipboard: { writeText: async (text: string) => void writes.push(text) } });
    renderAll();
    await act(async () => screen.getAllByRole('button', { name: /Copy/ })[1].click());
    expect(writes).toEqual(['pnpm install']);
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run src/views/home/sections.test.tsx`
Expected: FAIL. The sections are not exported.

- [ ] **Step 3: Keys**

Update `home.json`, EN then AR. Keep the existing keys and change only these:
- `features.*.desc`: shorten to the mockup copy (EN below). AR translations are given in the same shape.
- New: `features.number` is not needed (numbers are generated).
- `showcase.desc`: `"{{count}} MDX pages with live previews, code and usage notes for every component."` / `"{{count}} صفحة توثيق مع معاينات حيّة وأمثلة برمجية وملاحظات استخدام لكل مكوّن."`
- `cli.logFormatting`: `"Formatting with Oxfmt"` (the repo uses Oxfmt, not Prettier) / AR `"التنسيق باستخدام Oxfmt"`. `cli.logWritten`: `"Wrote 42 files · 1.8s"`.
- New `structure.aliases`: `{ "ui": "primitives", "forms": "form fields", "shared": "composites", "hooks": "hooks", "layouts": "app frame", "routes": "routing" }`; AR `{ "ui": "العناصر الأساسية", "forms": "حقول النماذج", "shared": "المكوّنات المركّبة", "hooks": "الخطافات", "layouts": "إطار التطبيق", "routes": "التوجيه" }`.
- New `gettingStarted.copy`: `"Copy {{command}}"` / `"نسخ {{command}}"`; `gettingStarted.copied`: `"Copied"` / `"تم النسخ"`.
- `footer.license`: `"MIT licence"` / `"رخصة MIT"`.
- Delete `techStack`, `showcase.searchPlaceholder`, `showcase.buttonTitle`, `showcase.buttonDesc`, `showcase.variantDefault`, `showcase.variantOutline`, `showcase.variantGhost`, after `grep -rn "techStack\|showcase\.\(search\|button\|variant\)" src` confirms only the deleted files used them. The new Documented specimen uses the literal component names (`Button`, `Dialog`, `Tabs`, `Calendar`, `Table`), which are API names and are not translated.

EN feature descriptions (`features.<key>.desc`):
- componentLibrary: "Radix primitives on one vocabulary — variant × tone × size, typed slots, dark mode by tokens."
- formSystem: "{{count}} fields with one contract: label, description, inline errors, React Hook Form + Zod." (pass `counts.forms`)
- dataTables: "Filters, sorting, pinning and pagination on TanStack Table, with numeric columns that read right in RTL."
- authentication: "Guards, layouts and permission-aware components."
- internationalization: "English and Arabic with full RTL; digits stay Western, data stays readable."
- errorMonitoring: "Boundaries and reporting wired in from the start."

AR feature descriptions:
- componentLibrary: "عناصر Radix بمفردات واحدة — النوع × النبرة × الحجم، وفتحات مضبوطة الأنواع، ووضع داكن عبر الرموز."
- formSystem: "{{count}} حقلًا بعقد واحد: تسمية ووصف وأخطاء ظاهرة، مع React Hook Form و Zod."
- dataTables: "تصفية وفرز وتثبيت وترقيم صفحات على TanStack Table، مع أعمدة رقمية تُقرأ بشكل صحيح من اليمين إلى اليسار."
- authentication: "حُرّاس وتخطيطات ومكوّنات تراعي الصلاحيات."
- internationalization: "العربية والإنجليزية مع دعم كامل للاتجاه من اليمين إلى اليسار؛ الأرقام تبقى غربية والبيانات واضحة."
- errorMonitoring: "حدود للأخطاء وإبلاغ عنها مدمجة منذ البداية."

- [ ] **Step 4: Implement**

`src/views/home/section/Section.tsx`:

```tsx
import { type ReactNode, useId } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

type SectionProps = { id?: string; eyebrow: ReactNode; title: ReactNode; description?: ReactNode; className?: string; children?: ReactNode };

function Section({ id, eyebrow, title, description, className, children }: SectionProps) {
  const titleId = useId();

  return (
    <section id={id} aria-labelledby={titleId} className="border-border-subtle border-t">
      <div className={cn('mx-auto max-w-6xl px-4 py-14 md:px-6', className)}>
        <p className="text-fg-muted font-mono text-xs font-medium tracking-wider uppercase">{eyebrow}</p>

        <h2 id={titleId} className="text-fg mt-2 text-2xl font-semibold tracking-tight rtl:leading-snug">
          {title}
        </h2>

        <Conditional.If condition={!!description}>
          <p className="text-fg-muted mt-2 max-w-prose text-base">{description}</p>
        </Conditional.If>

        {children}
      </div>
    </section>
  );
}

export default Section;
```

`features/Features.tsx`:

```tsx
import { useMemo } from 'react';

import { useAppTranslation } from '@hooks/shared';

import { getComponentDocsRegistry } from '@/component-docs/registry';

import { countDocs } from '../landing-stats';
import Section from '../section/Section';

const KEYS = ['componentLibrary', 'formSystem', 'dataTables', 'authentication', 'internationalization', 'errorMonitoring'] as const;

function Features() {
  const { t } = useAppTranslation('home');
  const forms = useMemo(() => countDocs(getComponentDocsRegistry()).forms, []);

  return (
    <Section eyebrow={t('features.eyebrow')} title={t('features.title')}>
      <ol className="border-border-subtle mt-6 border-t">
        {KEYS.map((key, index) => (
          <li
            key={key}
            data-slot="landing-feature"
            className="border-border-subtle grid gap-x-6 gap-y-1 border-b py-4 md:grid-cols-[3rem_14rem_1fr] md:items-baseline"
          >
            <span data-slot="landing-feature-number" dir="ltr" className="text-fg-subtle font-mono text-sm tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>

            <h3 className="text-fg text-sm font-semibold">{t(`features.${key}.title`)}</h3>

            <p className="text-fg-muted text-sm">{t(`features.${key}.desc`, { count: forms })}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default Features;
```

`md:grid-cols-[3rem_14rem_1fr]` is an arbitrary value with `rem` inside. The guard's regex (`-\[-?\d*\.?\d+(?:px|rem)\]`) needs the bracket to hold a single length, so a template list does not match. If `ds:baseline` refuses anyway, define the template with `grid-cols-[auto_minmax(0,14rem)_1fr]` and re-run.

`documented/Documented.tsx`:

```tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';
import { getComponentDocsRegistry } from '@/component-docs/registry';

import Section from '../section/Section';

const PAGES = ['Button', 'Dialog', 'Tabs', 'Calendar', 'Table'];

function Documented() {
  const { t } = useAppTranslation('home');
  const total = useMemo(() => getComponentDocsRegistry().length, []);

  return (
    <Section eyebrow={t('showcase.eyebrow')} title={t('showcase.title')} description={t('showcase.desc', { count: total })}>
      <div className="mt-6 grid items-start gap-8 md:grid-cols-[1fr_1.35fr]">
        <Button variant="outline" asChild className="justify-self-start">
          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX}>{t('showcase.cta')}</Link>
        </Button>

        <div aria-hidden="true" className="bg-surface border-border overflow-hidden rounded-lg border">
          <div dir="ltr" className="border-border-subtle text-fg-subtle border-b px-3 py-2 text-start font-mono text-xs">
            {t('showcase.browserUrl')}/button
          </div>

          <div className="grid grid-cols-[7rem_1fr]">
            <ul className="border-border-subtle text-fg-muted flex flex-col gap-1.5 border-e px-3 py-3 text-xs">
              {PAGES.map((page, index) => (
                <li key={page} className={index === 0 ? 'text-fg' : undefined}>
                  {page}
                </li>
              ))}
            </ul>

            <div className="p-3">
              <p className="text-fg text-sm font-semibold">Button</p>

              <p className="text-fg-muted mb-3 text-xs">variant × tone × size</p>

              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" tabIndex={-1}>Solid</Button>
                <Button size="sm" variant="outline" tabIndex={-1}>Outline</Button>
                <Button size="sm" variant="ghost" tabIndex={-1}>Ghost</Button>
                <Button size="sm" tone="accent" tabIndex={-1}>Accent</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default Documented;
```

The doc-page specimen is decorative (`aria-hidden`), and its buttons are `tabIndex={-1}`. The class `index === 0 ? 'text-fg' : undefined` is a value, not JSX branching, so `Conditional` is not needed. `md:grid-cols-[1fr_1.35fr]` holds no px/rem.

`tooling/Tooling.tsx`:

```tsx
import { useAppTranslation } from '@hooks/shared';

import { Check } from 'lucide-react';

import Section from '../section/Section';

const LOG = ['logFetching', 'logParsing', 'logGenerating', 'logFormatting', 'logWritten'] as const;

function Tooling() {
  const { t } = useAppTranslation('home');

  return (
    <Section id="tooling" eyebrow={t('cli.eyebrow')} title={t('cli.title')} description={t('cli.desc')}>
      <pre
        data-slot="landing-terminal"
        dir="ltr"
        className="bg-surface-sunken border-border text-fg-muted mt-6 overflow-x-auto rounded-lg border px-4 py-3 text-start font-mono text-xs leading-7"
      >
        <span className="text-fg">$ pnpm dto:gen</span>
        {LOG.map((key) => (
          <span key={key} className="flex items-center gap-2">
            <Check aria-hidden="true" className="text-success size-3.5" />
            {t(`cli.${key}`)}
          </span>
        ))}
      </pre>
    </Section>
  );
}

export default Tooling;
```

The log lines are translated sentences inside an LTR block. Arabic log text will read LTR-aligned, which is what a terminal does. Accepted.

`structure/Structure.tsx`:

```tsx
import { useAppTranslation } from '@hooks/shared';

import Section from '../section/Section';

const ALIASES = [
  ['@components/ui', 'ui'],
  ['@components/forms', 'forms'],
  ['@components/shared', 'shared'],
  ['@hooks/shared', 'hooks'],
  ['@layouts', 'layouts'],
  ['@routes', 'routes'],
] as const;

function Structure() {
  const { t } = useAppTranslation('home');

  return (
    <Section eyebrow={t('architecture.eyebrow')} title={t('architecture.title')} description={t('architecture.desc')}>
      <ul className="bg-border-subtle border-border-subtle mt-6 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 md:grid-cols-3">
        {ALIASES.map(([alias, key]) => (
          <li key={alias} className="bg-surface px-4 py-3">
            <code data-slot="landing-alias" dir="ltr" className="text-accent block text-start font-mono text-sm">
              {alias}
            </code>

            <span className="text-fg-muted text-xs">{t(`structure.aliases.${key}`)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default Structure;
```

That is one accent use per section (the alias names). If review reads six accent words as more than "one accent use", switch them to `text-fg` and ledger it.

`get-going/GetGoing.tsx`:

```tsx
import { useState } from 'react';

import { Card, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { Check, Copy } from 'lucide-react';

import Section from '../section/Section';

const STEPS = [
  { key: 'clone', command: 'git clone https://github.com/MohammadSafia/rsk.git' },
  { key: 'install', command: 'pnpm install' },
  { key: 'start', command: 'pnpm dev' },
] as const;

function GetGoing() {
  const { t } = useAppTranslation('home');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopied(command);
  };

  return (
    <Section eyebrow={t('gettingStarted.eyebrow')} title={t('gettingStarted.title')}>
      <ol className="mt-6 grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.key}>
            <Card>
              <Card.Content className="flex flex-col gap-2">
                <span className="text-fg-subtle font-mono text-xs">
                  <span dir="ltr">{String(index + 1).padStart(2, '0')}</span> · {t(`gettingStarted.${step.key}`)}
                </span>

                <div className="bg-surface-sunken border-border flex items-center gap-2 rounded-md border ps-3 pe-1">
                  <code data-slot="landing-command" dir="ltr" className="text-fg min-w-0 flex-1 truncate py-2 text-start font-mono text-xs">
                    {step.command}
                  </code>

                  <IconButton size="sm" aria-label={t('gettingStarted.copy', { command: step.command })} onClick={() => void copy(step.command)}>
                    <Conditional>
                      <Conditional.If condition={copied === step.command}>
                        <Check aria-hidden="true" className="text-success" />
                      </Conditional.If>

                      <Conditional.Else>
                        <Copy aria-hidden="true" />
                      </Conditional.Else>
                    </Conditional>
                  </IconButton>
                </div>
              </Card.Content>
            </Card>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default GetGoing;
```

Before committing, check the clone URL against `git remote get-url origin`. If it differs, use the real one, and if there is no remote, use `git clone <your-fork-url>`.

`landing-footer/LandingFooter.tsx`:

```tsx
import { Link } from 'react-router-dom';

import { Logo } from '@components/shared';

import { useAppTranslation } from '@hooks/shared';

import { FULL_ROUTES_PATH } from '@routes';

function LandingFooter() {
  const { t } = useAppTranslation('home');

  return (
    <footer className="border-border-subtle border-t">
      <div className="text-fg-muted mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-6 text-sm md:px-6">
        <Logo variant="lockup" size="sm" />

        <span>{t('footer.license')}</span>

        <span className="ms-auto flex gap-4">
          <Link to={FULL_ROUTES_PATH.COMPONENTS.INDEX} className="hover:text-fg">
            {t('nav.components')}
          </Link>

          <a href="https://github.com/MohammadSafia/rsk" className="hover:text-fg">
            {t('footer.github')}
          </a>
        </span>
      </div>
    </footer>
  );
}

export default LandingFooter;
```

Use the same repo URL as GetGoing.

`views/home/index.ts` exports all of them. HomePage:

```tsx
import { Documented, Features, GetGoing, Hero, LandingFooter, LandingNav, Specimen, Structure, Tooling } from '@views/home';

function HomePage() {
  return (
    <div data-slot="landing" className="bg-canvas text-fg min-h-dvh">
      <LandingNav />

      <main>
        <Hero />
        <Specimen />
        <Features />
        <Documented />
        <Tooling />
        <Structure />
        <GetGoing />
      </main>

      <LandingFooter />
    </div>
  );
}

export default HomePage;
```

Delete the old showcase and unused keys:

```bash
git rm -rq src/views/home/component-showcase
grep -rn "component-showcase\|ComponentShowcase" src   # must print nothing
```

The `HomePage` baseline entry (60+ legacy names, 29 arbitrary lengths) disappears with the rewrite, and `ComponentShowcase` leaves with its folder.

- [ ] **Step 5: Run tests and commit**

```bash
P exec vp test --run src/views src/pages/home tests/i18n && P exec tsc -b && \
P ds:baseline && P exec vp check && P exec vp build > $WS/build.log 2>&1 && \
git add -A src tests && git commit -m "feat(home): features, documented, tooling, structure, get-going and footer sections; retire the old landing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Class codemod + docs chrome (CodeBlock LTR, gallery panels, gallery pages)

**Files:**
- Create: `scripts/design-system/codemods/migrate-classes.ts`, `tests/design-system/migrate-classes.test.ts`
- Modify: `package.json` (`"ds:classes": "tsx scripts/design-system/codemods/migrate-classes.ts"`)
- Modify: `src/component-docs/code-block/CodeBlock.tsx`; create `src/component-docs/code-block/CodeBlock.test.tsx`
- Modify: `src/component-docs/gallery/doc-panel/DocPanel.tsx`, `gallery/sidebar-panel/SidebarPanel.tsx`, `gallery/utils.tsx`, `src/pages/components/ComponentDetailPage.tsx`, `src/pages/components/ComponentsGalleryPage.tsx`
- Create: `src/pages/components/gallery-chrome.test.tsx`
- Modify: `src/locales/{en,ar}/components.json` (gallery strings)

**Interfaces:**
- Produces `migrateClasses(source: string): { output: string; changes: number; unmapped: string[] }`. The CLI is `P ds:classes <file…>`: it rewrites the files in place and prints per-file change counts plus any unmapped legacy names. Unmapped names are left untouched for hand-fixing.
- Map (from `legacy-tokens.css`; the colour name is matched after any utility prefix and variant chain, and an opacity suffix `/NN` is kept):

| Legacy colour | Token | Prefix overrides |
|---|---|---|
| `background` | `canvas` | — |
| `foreground` | `fg` | — |
| `primary` | `accent` | — |
| `primary-foreground` | `accent-fg` | — |
| `secondary` | `surface-raised` | `text-secondary` → `text-fg-muted` |
| `secondary-foreground`, `popover-foreground` | `fg` | — |
| `popover` | `surface-raised` | — |
| `muted` | `border-strong` | `text-muted` → `text-fg-muted`; `bg-muted` → `bg-surface-sunken` |
| `muted-foreground` | `fg-muted` | — |
| `destructive` | `danger` | — |
| `destructive-foreground` | `danger-fg` | — |
| `success-foreground` / `warning-foreground` | `success-fg` / `warning-fg` | — |
| `primary-15/25/50/100/200` | `accent-subtle` | `border-primary-*` → `border-border` |
| `primary-300…900` | `accent` | — |
| `secondary-15…100`, `muted-50/100` | `surface-sunken` | — |
| `secondary-200/300`, `muted-200` | `border` | `bg-muted-200` → `bg-surface-sunken` |
| `secondary-400` | `border-strong` | — |
| `secondary-600/700`, `muted-400` | `fg-muted` | — |
| `secondary-800/900` | `fg` | — |
| `muted-300` | `fg-subtle` | — |
| `success-200/300`, `destructive-200/300`, `warning-200/300` | `<status>-subtle` (`destructive` → `danger`) | — |
| `success-400`, `destructive-400`, `warning-400` | `success`, `danger`, `warning` | — |

  Shadows: `shadow-boundary-ghost | shadow-boundary | shadow-spread | shadow-deep` → `shadow-raised`; `shadow-inner` → removed.

- [ ] **Step 1: Write the failing codemod test**

`tests/design-system/migrate-classes.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { migrateClasses } from '../../scripts/design-system/codemods/migrate-classes';

describe('migrateClasses', () => {
  it('maps colour names behind any prefix and variant chain, keeping opacity', () => {
    const { output, changes } = migrateClasses(
      `<div className="bg-background text-foreground hover:text-muted-foreground dark:bg-primary/10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground" />`,
    );
    expect(output).toBe(
      `<div className="bg-canvas text-fg hover:text-fg-muted dark:bg-accent/10 data-[active=true]:bg-accent data-[active=true]:text-accent-fg" />`,
    );
    expect(changes).toBe(6);
  });

  it('applies ramps and prefix overrides', () => {
    expect(migrateClasses('text-muted-400 bg-muted-50 border-muted-200 bg-muted-200 border-primary-100 text-primary-900 text-muted bg-muted').output).toBe(
      'text-fg-muted bg-surface-sunken border-border bg-surface-sunken border-border text-accent text-fg-muted bg-surface-sunken',
    );
    expect(migrateClasses('bg-destructive-200 text-destructive-400 bg-success-300 text-warning-400').output).toBe(
      'bg-danger-subtle text-danger bg-success-subtle text-warning',
    );
  });

  it('maps legacy shadows and leaves tokens and unrelated words alone', () => {
    expect(migrateClasses('shadow-spread shadow-boundary rounded-xl').output).toBe('shadow-raised shadow-raised rounded-xl');
    const untouched = 'bg-surface text-fg-muted text-accent background: primary colours, a muted tone';
    expect(migrateClasses(untouched).output).toBe(untouched);
  });

  it('reports names it cannot map', () => {
    expect(migrateClasses('text-primary-1000 bg-secondary-450').unmapped).toEqual(['text-primary-1000', 'bg-secondary-450']);
  });
});
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run tests/design-system/migrate-classes.test.ts`
Expected: FAIL. The module does not exist.

- [ ] **Step 3: Implement the codemod**

`scripts/design-system/codemods/migrate-classes.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';

const PREFIX = '(?:bg|text|border|ring|fill|stroke|outline|divide|decoration|caret|placeholder|from|to|via|accent)';

const NAME: Record<string, string> = {
  background: 'canvas',
  foreground: 'fg',
  primary: 'accent',
  'primary-foreground': 'accent-fg',
  secondary: 'surface-raised',
  'secondary-foreground': 'fg',
  popover: 'surface-raised',
  'popover-foreground': 'fg',
  muted: 'border-strong',
  'muted-foreground': 'fg-muted',
  destructive: 'danger',
  'destructive-foreground': 'danger-fg',
  'success-foreground': 'success-fg',
  'warning-foreground': 'warning-fg',
};

const RAMP: Record<string, Record<string, string>> = {
  primary: { 15: 'accent-subtle', 25: 'accent-subtle', 50: 'accent-subtle', 100: 'accent-subtle', 200: 'accent-subtle', 300: 'accent', 400: 'accent', 600: 'accent', 700: 'accent', 800: 'accent', 900: 'accent' },
  secondary: { 15: 'surface-sunken', 25: 'surface-sunken', 50: 'surface-sunken', 100: 'surface-sunken', 200: 'border', 300: 'border', 400: 'border-strong', 600: 'fg-muted', 700: 'fg-muted', 800: 'fg', 900: 'fg' },
  muted: { 50: 'surface-sunken', 100: 'surface-sunken', 200: 'border', 300: 'fg-subtle', 400: 'fg-muted' },
  success: { 200: 'success-subtle', 300: 'success-subtle', 400: 'success' },
  destructive: { 200: 'danger-subtle', 300: 'danger-subtle', 400: 'danger' },
  warning: { 200: 'warning-subtle', 300: 'warning-subtle', 400: 'warning' },
};

/** Whole-utility overrides where the plain mapping reads wrong. */
const OVERRIDE: Record<string, string> = {
  'text-secondary': 'text-fg-muted',
  'text-muted': 'text-fg-muted',
  'bg-muted': 'bg-surface-sunken',
  'bg-muted-200': 'bg-surface-sunken',
};

const SHADOW: Record<string, string> = {
  'shadow-boundary-ghost': 'shadow-raised',
  'shadow-boundary': 'shadow-raised',
  'shadow-spread': 'shadow-raised',
  'shadow-deep': 'shadow-raised',
  'shadow-inner': '',
};

const COLOUR = new RegExp(
  `(?<![\\w-])(${PREFIX})-(background|foreground|primary|secondary|popover|muted|destructive|success|warning)(?:-(foreground|\\d+))?(?![\\w-])`,
  'g',
);
const SHADOWS = /(?<![\w-])shadow-(?:boundary-ghost|boundary|spread|deep|inner)(?![\w-])/g;

const resolve = (prefix: string, name: string, suffix: string | undefined): string | null => {
  const whole = `${prefix}-${name}${suffix ? `-${suffix}` : ''}`;
  if (OVERRIDE[whole]) return OVERRIDE[whole];
  if (prefix === 'border' && name === 'primary' && suffix && Number(suffix) <= 200) return 'border-border';
  if (!suffix) return NAME[name] ? `${prefix}-${NAME[name]}` : null;
  if (suffix === 'foreground') return NAME[`${name}-foreground`] ? `${prefix}-${NAME[`${name}-foreground`]}` : null;
  const token = RAMP[name]?.[suffix];
  return token ? `${prefix}-${token}` : null;
};

export const migrateClasses = (source: string) => {
  let changes = 0;
  const unmapped: string[] = [];

  const output = source
    .replace(COLOUR, (match, prefix: string, name: string, suffix?: string) => {
      // success-/warning- without a suffix are already semantic tokens.
      if ((name === 'success' || name === 'warning') && !suffix) return match;
      const next = resolve(prefix, name, suffix);
      if (next === null) {
        unmapped.push(match);
        return match;
      }
      changes += 1;
      return next;
    })
    .replace(SHADOWS, (match) => {
      changes += 1;
      return SHADOW[match];
    })
    .replace(/ {2,}(?=[^\n]*["'`])/g, ' ');

  return { output, changes, unmapped };
};

const isCli = process.argv[1]?.endsWith('migrate-classes.ts');

if (isCli) {
  for (const file of process.argv.slice(2)) {
    const { output, changes, unmapped } = migrateClasses(readFileSync(file, 'utf8'));
    if (changes) writeFileSync(file, output);
    console.log(`${file}: ${changes} change(s)${unmapped.length ? `, unmapped: ${unmapped.join(' ')}` : ''}`);
  }
}
```

The last `.replace` collapses the double space left by a removed `shadow-inner`. If it touches more than class strings in practice, delete it and fix the stray spaces with `vp fmt`/by hand. The test does not cover `shadow-inner` removal spacing.

`(?<![\w-])` keeps `text-fg-muted` from matching `muted` inside a token, and stops prose words like "a muted tone" from matching (they lack a utility prefix).

- [ ] **Step 4: Run it**

Run: `P exec vp test --run tests/design-system/migrate-classes.test.ts`
Expected: PASS (4 tests). Add the `ds:classes` script to `package.json` next to `ds:migrate`.

- [ ] **Step 5: Write the failing chrome tests**

`src/component-docs/code-block/CodeBlock.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { CodeBlock } from './CodeBlock';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('CodeBlock', () => {
  it('stays left-to-right in mono under Arabic, with a named copy button', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <Tooltip.Provider>
        <CodeBlock>
          <code>{'<Button tone="danger">Delete</Button>'}</code>
        </CodeBlock>
      </Tooltip.Provider>,
    );
    const pre = document.querySelector('pre') as HTMLElement;
    expect(pre.getAttribute('dir')).toBe('ltr');
    expect(pre.className).toContain('text-start');
    expect(pre.className).toContain('font-mono');
    expect(screen.getByRole('button', { name: i18n.t('components:code.copy') })).toBeTruthy();
    expect(document.body.innerHTML).not.toMatch(/primary|muted|foreground|gradient|backdrop-blur|shadow-\[/);
  });
});
```

`src/pages/components/gallery-chrome.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import ComponentDetailPage from './ComponentDetailPage';
import ComponentsGalleryPage from './ComponentsGalleryPage';

import '../../i18n';

afterEach(cleanup);

const at = (path: string) =>
  render(
    <Tooltip.Provider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/components" element={<ComponentsGalleryPage />} />
          <Route path="/components/:id" element={<ComponentDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Tooltip.Provider>,
  );

describe('docs gallery chrome', () => {
  it('gallery uses tokens and translated copy', () => {
    const { container } = at('/components');
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(container.innerHTML).not.toMatch(/primary-|muted-|text-foreground|bg-background|text-muted-foreground/);
    expect(container.textContent).not.toMatch(/Filter by tag|No components found|Loading documentation/);
  });

  it('detail page uses PageHeader with a breadcrumb, and EmptyState when the id is unknown', () => {
    at('/components/button');
    expect(screen.getByRole('heading', { level: 1, name: 'Button' }).closest('[data-slot="page-header"]')).not.toBeNull();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeTruthy();
    cleanup();

    at('/components/does-not-exist');
    expect(document.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });
});
```

Check the Button doc's id with `grep -rn "^id: button" src/component-docs`. If it differs, use the real id.

- [ ] **Step 6: Run them**

Run: `P exec vp test --run src/component-docs/code-block src/pages/components/gallery-chrome.test.tsx`
Expected: FAIL. The legacy classes, hard-coded copy and missing `dir` are all present.

- [ ] **Step 7: Keys**

Add a `code` block and gallery copy to `components.json` (check the existing structure with `python3 -c "import json;print(list(json.load(open('src/locales/en/components.json'))))"`, and merge into `gallery`/`detail` if those objects exist):
- EN: `"code": { "copy": "Copy code", "copied": "Copied" }`; `gallery.filterByTag: "Filter by tag"`, `gallery.tagsShown: "Showing {{count}} tags. Use search to narrow further."`, `gallery.noResults: "No components found."`, `detail.loading: "Loading documentation…"` (reuse `detail.loadingDocumentation` if it exists).
- AR: `"code": { "copy": "نسخ الشيفرة", "copied": "تم النسخ" }`, `"filterByTag": "التصفية حسب الوسم"`, `"tagsShown": "عرض {{count}} وسمًا. استخدم البحث لتضييق النتائج."`, `"noResults": "لا توجد مكوّنات."`, `"loading": "جارٍ تحميل التوثيق…"`.

- [ ] **Step 8: CodeBlock**

Replace `copyButtonStyles`, `preStyles` and the `CodeBlock` function. Keep `extractText` and `useCopyToClipboard`.

```tsx
const preStyles =
  'bg-code-surface text-code-foreground border-border overflow-x-auto rounded-lg border p-5 pt-7 text-start font-mono text-sm leading-relaxed';

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const { t } = useAppTranslation('components');
  const text = extractText(children).trim();
  const { copied, canCopy, copy } = useCopyToClipboard(text);

  if (!text) return null;

  return (
    <div data-slot="code-block" className="not-prose group relative my-6">
      <IconButton
        size="sm"
        variant="ghost"
        aria-label={t(copied ? 'code.copied' : 'code.copy')}
        disabled={!canCopy}
        onClick={copy}
        className="text-code-muted hover:text-code-foreground absolute end-3 top-3 z-10"
      >
        <Conditional>
          <Conditional.If condition={copied}>
            <Check aria-hidden="true" className="text-success" />
          </Conditional.If>

          <Conditional.Else>
            <Copy aria-hidden="true" />
          </Conditional.Else>
        </Conditional>
      </IconButton>

      <pre dir="ltr" {...props} className={cn(preStyles, className)}>
        {children}
      </pre>
    </div>
  );
}
```

Imports: `IconButton` from `@components/ui`, `Conditional` from `@components/utils`, `useAppTranslation` from `@hooks/shared`, `cn` from `@utils`.

The code tokens `bg-code-surface`, `text-code-foreground` and `text-code-muted` exist in the theme (`--color-code-*`). Check how MDX renders inline `code`: `grep -rn "code:" src/component-docs/docs-layout src/component-docs/gallery/utils.tsx`. If an inline-code component is mapped, give it `dir="ltr"` and `font-mono` too (Review Focus 5).

- [ ] **Step 9: Run the codemod on the chrome, then hand-fix**

```bash
P ds:classes src/component-docs/gallery/doc-panel/DocPanel.tsx src/component-docs/gallery/sidebar-panel/SidebarPanel.tsx \
  src/component-docs/gallery/utils.tsx src/pages/components/ComponentDetailPage.tsx src/pages/components/ComponentsGalleryPage.tsx
```

Then by hand:
- **Strings:**
  - `Loading documentation...` → `t('detail.loading')` (or the existing key)
  - `Filter by tag` → `t('gallery.filterByTag')`
  - `Showing {n} tags…` → `t('gallery.tagsShown', { count })`
  - `No components found.` → `EmptyState size="sm" kind="no-results" title={t('gallery.noResults')}`

  Each file gets `useAppTranslation('components')`.
- **ComponentDetailPage:**
  - The hand-built breadcrumb + `h1` + description become `<PageHeader title={selectedDoc.title} description={selectedDoc.description} breadcrumb={[{ title: t('gallery.title'), href: 'components' }, { title: selectedDoc.title }]} />`.
  - The not-found branch becomes `<EmptyState kind="no-results" title={t('detail.notFoundTitle')} description={t('detail.notFoundDescription', { id })}>` with an `EmptyState.Actions` outline `Button asChild` link back to the gallery.
  - The loading fallback becomes `<Spinner overlay />` inside a `relative min-h-40` box.
  - Drop the `min-h-screen bg-*` wrappers: the page now lives inside AppShell, which owns the background.
- **ComponentsGalleryPage:** drop `min-h-screen bg-*` the same way; `text-primary-900 text-2xl font-bold` h1 → a `PageHeader title={t('gallery.title')} description={t('gallery.subtitle')}`.
- **The `? :` / `&&` JSX in these files** (e.g. `tags.length > 3 ? <span…> : null`) becomes `Conditional.If`.
- **Arbitrary lengths** left after the codemod: replace with the scale (`ds:baseline` lists them).

- [ ] **Step 10: Run tests and commit**

```bash
P exec vp test --run tests/design-system src/component-docs src/pages tests/i18n && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && \
P ds:baseline && P exec vp check && P docs:lint && \
git add -A scripts src tests package.json && git commit -m "feat(docs): class codemod; LTR mono code blocks; gallery chrome on tokens, PageHeader and EmptyState

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: MDX pages and the `docs:new` template

**Files:**
- Modify: every `src/component-docs/**/*.mdx` listed in the baseline (`python3 -c "import json;print('\n'.join(f for f in json.load(open('tests/design-system/forbidden-patterns.baseline.json')) if f.endswith('.mdx')))"`)
- Modify: `src/component-docs/_template/component.mdx.tpl`, `src/component-docs/_template/component-doc-template.mdx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (guard: `src/component-docs/` clean)

**Interfaces:**
- Consumes: `P ds:classes` (Task 6).

- [ ] **Step 1: Write the failing guard**

Append to `describe('clean primitives', …)`:

```ts
  it('component docs contain no forbidden patterns (SP3 Plan C)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/component-docs/'));
    expect(offenders).toEqual([]);
  });

  it('the docs:new template emits the kit conventions', () => {
    const template = readFileSync(`${REPO_ROOT}src/component-docs/_template/component.mdx.tpl`, 'utf8');
    expect(template).toMatch(/## API/);
    expect(template).toMatch(/text-fg-muted|bg-surface/);
    expect(template).not.toMatch(/muted-foreground|primary|bg-background/);
  });
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL, listing the MDX files (and the template if it has no API section).

- [ ] **Step 3: Codemod, then hand-fix**

```bash
P ds:classes $(grep -rlE "(bg|text|border|ring|fill)-(background|foreground|primary|secondary|muted|destructive|popover)|shadow-(spread|boundary|deep|inner)" src/component-docs --include='*.mdx')
```

Then fix by hand whatever `ds:baseline` still reports for `src/component-docs/`:
- **`arbitrary-length`:** use the scale (`h-[28rem]` → `h-112`, `w-[200px]` → `w-50`, `text-[11px]` → `text-2xs`).
- **unmapped names** printed by the codemod: map them per the Task 6 table's intent.
- **Prose naming removed APIs:** `grep -rnE "PrimeLoader|BlankSlate|ActionPanel|MetaCard|GridCard|PrimeCard|CollapsibleCard|FormSubmitButtons|FieldSection|FormControl|FormLabel|FormMessage|ErrorTooltip|ui/layout|DashboardLayout" src/component-docs` must print nothing. Rewrite any hit to the replacement component.
- **Physical classes:** `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`/`text-left`/`text-right` in MDX examples become logical (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`/`text-end`), from `grep -rnE "\b(ml|mr|pl|pr)-[0-9]|\b(left|right)-[0-9]|text-(left|right)\b" src/component-docs --include='*.mdx'`.

- [ ] **Step 4: Template**

`component.mdx.tpl` (and the `.mdx` twin) become:

````mdx
---
id: {{id}}
title: {{title}}
section: Components
category: {{category}}
description: 'One sentence: what it is for and when to reach for it.'
tags: [{{categoryTag}}, {{id}}]
---

import { {{name}} } from '@components/{{folder}}';

## Demo

<div className="flex w-full flex-col gap-6">
  <{{name}} />
</div>

## Imports

```tsx
import { {{name}} } from '@components/{{folder}}';
```

## Code

```tsx
<{{name}} />
```

## API

| Prop | Type | Default | Notes |
|---|---|---|---|
| `className` | `string` | — | Merged with `cn`; style with semantic tokens (`bg-surface`, `text-fg-muted`), never palette or legacy names. |

## Conventions

- Every part sets `data-slot`; JSX branches use `Conditional`; copy comes from i18n (EN and AR).
````

Check the placeholder syntax the `docs:new` script substitutes (`grep -n "{{\|replace" src/component-docs/scripts/*.ts | head`). Use its exact placeholder names; `{{name}}`/`{{folder}}` above are examples. If the script only substitutes some of them, keep the rest as literal guidance text.

Then run `P docs:new` in a dry-run/temp mode (or call its render function) and confirm the output lints. If that is impractical, `P docs:lint` on the template twin is enough.

- [ ] **Step 5: Run tests and commit**

```bash
P exec vp test --run tests/design-system src/component-docs && P docs:lint && P exec vp build > $WS/build.log 2>&1 && \
P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "docs: migrate every MDX page to tokens and logical classes; template emits the kit conventions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Gallery demos (`components.data.demos.tsx`)

**Files:**
- Modify: `src/pages/components/components.data.demos.tsx`
- Modify: `tests/design-system/forbidden-patterns.test.ts` (guard: `src/pages/` clean)

- [ ] **Step 1: Write the failing guard**

```ts
  it('pages contain no forbidden patterns (SP3 Plan C)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/pages/') || file.startsWith('src/views/'));
    expect(offenders).toEqual([]);
  });
```

- [ ] **Step 2: Run it**

Run: `P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL on `components.data.demos.tsx` (43 ramp, 42 name, 5 arbitrary).

- [ ] **Step 3: Codemod, then hand-fix**

```bash
P ds:classes src/pages/components/components.data.demos.tsx
```

Then:
- Fix the 5 arbitrary lengths with scale values.
- Map any unmapped names.
- Replace JSX `? :`/`&&` branches that render elements with `Conditional`, but only those in lines you touch anyway; the file is demo data, not a component library.
- Check that `FieldFamilyDemo.test.tsx` still passes.

Demo strings stay English. They are sample content inside the docs, not app UI. That is the Plan B ruling for the dashboard demo data.

- [ ] **Step 4: Run tests and commit**

```bash
P exec vp test --run tests/design-system src/pages && P exec tsc -b && P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "docs(gallery): demos on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Deferred minors (SP2 owned by Plan C, plus Plan B's review minors)

**Files:**
- Modify: `tests/design-system/contrast.test.ts`, possibly `src/styles/tokens.css` (`--fg-muted` light)
- Modify: `src/components/ui/calendar/Calendar.tsx` (outside days), `ui/accordion/Accordion.tsx`, `ui/collapsible/Collapsible.tsx`, `shared/app-shell/AppShell.tsx` (reduced motion; resize close; focus after item choice), `shared/toaster/Toaster.tsx` (swipe direction), `ui/input/Input.tsx` (`dir="auto"`)
- Modify: `shared/sidebar/Sidebar.tsx` (collapsed SubMenu tooltip; collapsed state on mobile), `calendar/calendar-grid/CalendarGrid.tsx` (skip unparseable events), `tables/data-table/data-table-toolbar/DataTableToolbar.tsx` (`role="group"`), `locales/ar/common.json` (`fileCard.documents_zero/_two`), `calendar/calendar-grid/CalendarGrid.test.tsx` (assert an Arabic weekday)
- Tests next to each file (named below)

Each item below is one RED→GREEN cycle: write the test, watch it fail, fix, watch it pass. Commit once at the end.

- [ ] **9.1 Contrast on tints.** In `contrast.test.ts`, add a describe block: for `.light` and `.dark`, for each of `accent, success, warning, danger, info`, the `fg` and `fg-muted` text on `<status>-subtle`, composited over `surface`, must be ≥ 4.5. Add `fg` on the selected-row tint, whatever the Table selected row uses (`grep -n "selected" src/components/ui/table/Table.tsx`), and on the past-event style of `CalendarEvent`. If a pair fails, darken `--fg-muted` (light) or lighten it (dark) in `tokens.css` in 0.01 L steps until it passes, then re-run the whole contrast suite. Ledger the final value.
- [ ] **9.2 Outside days.** In `Calendar.test.tsx`: an outside-month day that is not disabled has `text-fg-muted`; a disabled day keeps `text-fg-subtle`. In `Calendar.tsx:47,203`, outside days use `data-[outside=true]:text-fg-muted` and `outside: cn('text-fg-muted', …)`.
- [ ] **9.3 Reduced motion.** Accordion content, Collapsible content and the AppShell aside each carry `motion-reduce:animate-none`/`motion-reduce:transition-none`. Test by class presence in `Accordion.test.tsx`, `Collapsible.test.tsx` (create one if missing) and `AppShell.test.tsx`.
- [ ] **9.4 Toast swipe.** In `Toaster.test.tsx`: under `ar`, the provider's swipe direction is `left`, and under `en` it is `right`. Read it through a toast's `data-swipe-direction` attribute if Radix exposes one. If not, export a tiny `swipeDirectionFor(dir)` helper and unit-test it. In `Toaster.tsx`, `swipeDirection={direction === 'rtl' ? 'left' : 'right'}` comes from `useAppTranslation().direction`.
- [ ] **9.5 Input `dir="auto"`.** In `Input.test.tsx`, the rendered `<input>` has `dir="auto"` unless a `dir` prop is passed. Put `dir="auto"` before `{...props}`.
- [ ] **9.6 Drawer follow-ups (Plan B review).** In `AppShell.test.tsx`:
  - (a) Choosing a drawer item moves focus to `main` (`document.activeElement === screen.getByRole('main')`).
  - (b) A `matchMedia('(min-width: 768px)')` change to matching closes an open drawer. Mock `window.matchMedia` in the test with a listener you can fire.

  Implement (a) in `Sidebar.Item`'s click (`closeMobile(false)` then `document.getElementById(contentId)?.focus()` through the shell context) and (b) with an effect in `AppShell` that subscribes to the media query.
- [ ] **9.7 SubMenu (Plan B review).** In `Sidebar.test.tsx`:
  - The collapsed SubMenu trigger is wrapped in a Tooltip (has `data-state`).
  - With `collapsed` and the shell's `mobileOpen` true, the submenu panel renders (collapsed applies only from `md`).

  Implement by wrapping the trigger in `Tooltip` (`disabled={!collapsed}`) and computing `const effectiveCollapsed = collapsed && !mobileOpen` in `Item` and `SubMenu`. Clicking while effectively collapsed still calls `setCollapsed(false)`.
- [ ] **9.8 Tolerant calendar.** In `CalendarGrid.test.tsx`: an event with `start: 'not-a-date'` alongside a valid one renders the valid one and does not throw. In `CalendarGrid.tsx`, filter `events` once through `isValid(new Date(getStartTime(e)))` and the same for `getEndTime` before any grouping or placement.
- [ ] **9.9 Small fixes.**
  - `DataTableToolbar` filter row `role="toolbar"` → `role="group"` (and drop `aria-orientation`). The DataTable test asserts the group by name `Filters` after toggling.
  - AR `fileCard.documents_zero` → `"مستند"`, `documents_two` → `"مستند"`: the dual noun under a printed "2" doubles the number. The FileCard test's `مستندان` expectation becomes `مستند`.
  - The Arabic weekday test asserts `screen.getByText('أحد')`, or whatever date-fns `ar` `EEE` yields for Sunday. Check once in a scratch run and pin it.

- [ ] **Commit**

```bash
P exec vp test --run src tests && P exec tsc -b && P ds:baseline && P exec vp check && \
git add -A src tests && git commit -m "fix: SP2/Plan B deferred minors — tint contrast, outside days, reduced motion, toast swipe, Input dir=auto, drawer focus and resize, collapsed submenu, tolerant calendar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Delete the legacy bridge; empty baseline

**Files:**
- Delete: `src/styles/legacy-tokens.css`
- Modify: `src/index.css` (drop the `@import`), `src/styles/theme.css` (drop the "before legacy-tokens" comment), `src/lib/constants/DesignTokens.ts` (drop legacy entries), `tests/design-system/contrast.test.ts` (drop the `legacy bridge contrast` block), `tests/design-system/forbidden-patterns.test.ts` (empty-baseline guard), `tests/design-system/forbidden-patterns.baseline.json` (becomes `{}`)

- [ ] **Step 1: Write the failing guard**

Replace the Plan-specific folder guards' role with one exit guard (keep the others; they still document intent):

```ts
describe('SP3 exit', () => {
  it('the forbidden-pattern baseline is empty', () => {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
    expect(baseline).toEqual({});
    expect(scanRepo(REPO_ROOT)).toEqual({});
  });

  it('the legacy bridge is gone', () => {
    expect(existsSync(`${REPO_ROOT}src/styles/legacy-tokens.css`)).toBe(false);
    expect(readFileSync(`${REPO_ROOT}src/index.css`, 'utf8')).not.toContain('legacy-tokens');
  });
});
```

Add `existsSync` to the `node:fs` import.

- [ ] **Step 2: Run it**

Run: `P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL. List what `scanRepo` still reports, which is the work for Step 3.

- [ ] **Step 3: Clear the stragglers**

For each file still in `scanRepo`, run `P ds:classes <file>` and hand-fix the rest. The expected stragglers, given the earlier tasks:
- `src/assets/icons/*` hex fills → `currentColor` (callers set `text-*`)
- `src/component-docs/code-block`
- anything `HomePage` left

`hex-color` in `src/lib/constants/DesignTokens.ts`: read the file first. If it is the token documentation used by the Foundations docs page, its legacy section is deleted; any non-legacy hex documents the palette. Replace those values with `var(--token)` strings, or with the oklch values from `tokens.css` (oklch is not hex, but `raw-color-function` would match `oklch(`). In that case keep `var(--…)` references only.

- [ ] **Step 4: Delete the bridge**

```bash
git rm -q src/styles/legacy-tokens.css
sed -i '' "/legacy-tokens.css/d" src/index.css
```

- Edit `theme.css`'s comment that mentions the bridge.
- Delete the `legacy bridge contrast` describe block (and its `LEGACY_PAIRS`) from `contrast.test.ts`.
- `grep -rn "prime-loader-move\|animate-prime" src` must print nothing.

- [ ] **Step 5: Prove nothing silently lost its colour**

The guard catches legacy names in source. Also build and check that the CSS has no `var(--primary` / `var(--muted` / `var(--background` references left by an inline style or an arbitrary value:

```bash
P exec vp build > $WS/build.log 2>&1 && grep -oE "var\(--(primary|secondary|muted|destructive|background|foreground|popover)[a-z0-9-]*\)" dist/assets/*.css dist/assets/*.js | sort -u
```

Expected: no output. For any hit, find the source (`grep -rn "var(--primary" src`) and point it at the token.

- [ ] **Step 6: Empty the baseline and run everything**

```bash
P ds:baseline   # writes {} (0 files / 0 violations)
P exec vp test --run src tests && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && P docs:lint && P exec vp check
```

Expected: all green, and the baseline file is `{}`.

- [ ] **Step 7: Commit**

```bash
git add -A src tests && git commit -m "feat(design-system): delete the legacy token bridge; forbidden-pattern baseline is empty

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: SP3 exit — full gate and four-way screenshots

- [ ] **Step 1: Full gate**

```bash
P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && \
P exec vp build > $WS/build.log 2>&1 && P docs:lint && P exec vp test --run src tests > $WS/gate.log 2>&1; echo "exit $?"; tail -6 $WS/gate.log
```

Expected: `exit 0`, the baseline `{}`. Ledger the test count.

- [ ] **Step 2: Four-way screenshots**

Use the Plan B harness: `vp dev --port 5199`, playwright-cli, `localStorage` keys `vite-ui-theme` (JSON), `i18nextLng`, `rsk:sidebar-collapsed`, and contact sheets via `file://` HTML pages.

For dark/light × EN/AR, capture:
- `/` (the full page, `fullPage: true`)
- `/auth/login`
- `/dashboard`
- `/components`
- `/components/button`
- `/components/logo`
- `/components/data-table`
- `/components/calendar-grid`
- `/components/foundations`

Also capture the landing at 390 wide (light EN, dark AR), and a tab strip showing the favicon. For the favicon, render `public/favicon.svg` at 64px in both schemes with `page.emulateMedia({ colorScheme })`.

Read every sheet. Fix anything broken:
- reversed code
- an accent used twice in one landing section
- a clipped Arabic heading
- mismatched control heights
- a missing logo
- a visible gradient or glow

Ledger each fix with its screenshot name.

- [ ] **Step 3: Commit**

```bash
git add -A src tests && git commit -m "test(design-system): SP3 exit — empty baseline, landing, logo, docs verified four-way

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
