# UI Kit Foundations (Sub-project 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace RSK's Ocean Blue numeric color ramps with the Graphite Instrument token system (semantic colors, typography, shape, elevation, motion, states) without breaking any existing component, guarded by contrast, contract and forbidden-pattern tests, and documented on a Foundations gallery page.

**Architecture:** CSS is split into five focused files under `src/styles/` imported by `src/index.css`: a raw OKLCH palette (layer 1), semantic tokens per mode (layer 2), a Tailwind `@theme` that exposes only semantic tokens and foundation scales, a temporary legacy bridge that re-points old token names at the new palette, and foundation utilities (elevation, motion, focus/press/invalid states). Node-side Vitest tests parse these CSS files to enforce WCAG contrast and the token contract; a ratchet test stops banned patterns from growing. A docs-only Foundations page renders the system in both modes.

**Tech Stack:** Tailwind CSS 4.3 (`@theme inline`, `@utility`), Vite+ (`vp`: Vite 8, Vitest 5, Oxlint, Oxfmt), React 18, TypeScript 5.9, MDX gallery, happy-dom + @testing-library/react (new dev deps, approved).

**Spec:** `docs/superpowers/specs/2026-10-15-ui-kit-design-system-design.md` (§6 conventions, §7 Foundations, §10 verification).

## Global Constraints

- Branch: `feat/ui-kit-design-system`. Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Package commands: the repo pins `pnpm@10.34.7` but the global pnpm is 9.x — always run `corepack pnpm@10.34.7 <args>` (written below as `P <args>`; define it per shell with `P() { corepack pnpm@10.34.7 "$@"; }`).
- Test imports come from `vite-plus/test` (never `vitest` — Oxlint rule `vite-plus/prefer-vite-plus-imports`). Node is the default test environment; DOM tests opt in with a first-line `// @vitest-environment happy-dom`.
- Code standards (README "Code Standards"): `type` not `interface`; `import type` for types; alias imports in group order (React → third-party → UI → shared → hooks → utils → icons → types); `Conditional.If` instead of `&&`/ternaries in JSX; `handle*` handlers; default export last; no `any`; no TODOs.
- Styling: semantic tokens only; **no hex/rgb/oklch literals in `.tsx`/`.mdx`**; **no arbitrary length values** (`p-[24px]`, `text-[12px]`); layout brackets like `grid-cols-[auto_1fr]` are allowed.
- Token values in this plan are final and contrast-verified. If a contrast test fails after a deliberate edit, fix it by changing **only the `L` (lightness) channel** of the failing token.
- Dark stays the default theme; light values live on `:root, .light`, dark on `.dark` (ThemeProvider toggles these classes on `<html>`).
- Spec deviations decided during planning (keep them):
  - Raw ramps are fixed-step mode-independent scales; semantic tokens hold the tuned literal values (ramps feed the legacy bridge, sidebar/code tokens and future charts).
  - Arabic uses per-glyph font fallback (`'Schibsted Grotesk', 'Noto Kufi Arabic', …`) instead of reordering families under `[dir=rtl]`, so digits and punctuation stay in Schibsted in both locales; RTL gets the +0.2em leading boost only — no font-size reduction (keeps layout metrics identical across locales).
  - Control heights are exposed as `--spacing-control-sm|md|lg` (Tailwind v4 spacing namespace → `h-control-md`).
  - `tabular-nums` is applied per component (tables, stats, money) in sub-projects 2–3; Foundations adds no global numeric rule. Legacy shadows (`shadow-boundary*`, `-spread`, `-deep`, `-inner`) move to the legacy bridge and are deleted with it in sub-project 2.
  - `@testing-library/dom` is installed alongside `@testing-library/react` because it is RTL 16's required peer dependency.

## Review Focus

1. **A legacy class whose meaning flips.** `accent` changes from "soft blue hover surface" to "Oxblood". Any `bg-accent` / `accent-200..400` / `accent-foreground` usage left behind would paint menus and calendar cells solid Oxblood. → Task 3 adds a test asserting no legacy accent utilities remain in `src/`.
2. **A light panel nested inside the dark app.** The Foundations page (and future theme previews) render a `.light` panel inside `<html class="dark">`. That only works if light tokens are declared on `.light` as well as `:root`. → Task 2 asserts the light block selector is exactly `:root,\n.light`.
3. **Arabic line height.** Kufi needs more leading. If a text-scale line-height forgets the `--leading-rtl-boost` term, Arabic lines collide. → Task 4 asserts every `--text-*--line-height` includes the boost and `[dir='rtl']` sets it.
4. **Reduced motion.** Users with `prefers-reduced-motion` must still get fades but no movement, including tw-animate-css enter/exit animations. → Task 5 asserts the reduced-motion block neutralizes every `--tw-enter-*`/`--tw-exit-*` transform variable.
5. **The ratchet blocking legitimate code.** The forbidden-pattern scan must not count layout brackets (`grid-cols-[auto_1fr]`, `rounded-[inherit]`), `max-w-[100dvw]`, or `var(--x)` color references. → Task 6 unit tests pin these negatives.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `tests/design-system/color.ts` | OKLCH parsing, OKLCH→sRGB, WCAG luminance/contrast | 1 |
| `tests/design-system/css-tokens.ts` | Read project files, extract custom properties from a CSS block, resolve `var()` chains | 1 |
| `tests/design-system/color.test.ts` | Unit tests for the two helpers above | 1 |
| `tsconfig.scripts.json` | Add `tests` to the Node-typed project so tsgolint type-checks it | 1 |
| `src/styles/palette.css` | Layer 1 raw OKLCH ramps | 2 |
| `src/styles/tokens.css` | Layer 2 semantic tokens (light + dark), durations, RTL leading var | 2 |
| `tests/design-system/contrast.test.ts` | WCAG AA on semantic pairs in both modes | 2 |
| `src/lib/constants/DesignTokens.ts` | Single source of truth for roles and scales (docs + contract tests) | 3, 4, 5 |
| `src/styles/theme.css` | Tailwind `@theme inline`: semantic colors, fonts, type scale, radius, control sizes, easing | 3, 4, 5 |
| `src/styles/legacy-tokens.css` | Temporary bridge for old token names (deleted in sub-project 2) | 3 |
| `src/index.css` | Imports + `@custom-variant` + base layer only | 3, 4, 5 |
| `tests/design-system/theme-contract.test.ts` | Token/theme/utility contract | 3, 4, 5 |
| `src/styles/utilities.css` | `@utility` elevation, motion, focus/press/invalid states, reduced motion | 5 |
| `tests/design-system/forbidden-patterns.ts` | Pattern list, scanner, baseline comparison | 6 |
| `tests/design-system/forbidden-patterns.test.ts` | Scanner unit tests + ratchet against baseline | 6 |
| `tests/design-system/forbidden-patterns.baseline.json` | Committed per-file violation counts | 6 |
| `scripts/design-system/update-forbidden-baseline.ts` | Regenerates the baseline (`P ds:baseline`) | 6 |
| `src/component-docs/foundations/*` | Docs-only showcase components + `Foundations.mdx` + render test | 7 |
| `src/component-docs/gallery/utils.tsx` (+ test) | Put the Foundations tab first | 7 |
| `.claude/skills/redesign-skill`, `.claude/skills/output-skill` | Taste design-lens skills (project-local) | 8 |
| `.impeccable.md`, `README.md` | Describe the new system | 8 |

---

### Task 1: Design-token test harness (color math + CSS token parser)

**Files:**
- Create: `tests/design-system/color.ts`
- Create: `tests/design-system/css-tokens.ts`
- Test: `tests/design-system/color.test.ts`
- Modify: `tsconfig.scripts.json` (`include`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Oklch = { l: number; c: number; h: number; alpha: number }`
  - `parseOklch(value: string): Oklch` — accepts `oklch(L C H)` and `oklch(L C H / A%)`; throws `Error('Not an oklch() color: <value>')` otherwise.
  - `oklchToSrgb(color: Oklch): [number, number, number]` — gamma-encoded sRGB channels clamped to 0..1.
  - `relativeLuminance(rgb: [number, number, number]): number`
  - `contrastRatio(a: [number, number, number], b: [number, number, number]): number`
  - `readProjectFile(relativePath: string): string` — path relative to the repo root.
  - `extractBlock(css: string, selector: string): Record<string, string>` — custom properties (without `--`) declared in the first `<selector> {` block; throws if the selector is missing.
  - `resolveToken(vars: Record<string, string>, name: string): string` — follows `var(--x)` chains; throws on missing tokens or cycles.

- [ ] **Step 1: Write the failing test**

Create `tests/design-system/color.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { contrastRatio, oklchToSrgb, parseOklch, relativeLuminance } from './color';
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
    expect(readProjectFile('package.json')).toContain('"name": "react-start-kit"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run tests/design-system/color.test.ts`
Expected: FAIL — `Failed to resolve import "./color"`.

- [ ] **Step 3: Write minimal implementation**

Create `tests/design-system/color.ts`:

```ts
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
```

Create `tests/design-system/css-tokens.ts`:

```ts
/**
 * Minimal CSS custom-property reader for token tests. Only supports the flat
 * `selector { --name: value; }` blocks used in src/styles/*.css.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));

const VAR_REFERENCE = /^var\(--([\w-]+)\)$/;

export function readProjectFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), 'utf8');
}

export function extractBlock(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`Selector not found: ${selector}`);

  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const vars: Record<string, string> = {};

  for (const match of css.slice(open + 1, close).matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    vars[match[1]] = match[2].trim();
  }

  return vars;
}

export function resolveToken(vars: Record<string, string>, name: string, seen: Set<string> = new Set()): string {
  const value = vars[name];
  if (value === undefined) throw new Error(`Token --${name} is not defined`);

  const reference = VAR_REFERENCE.exec(value);
  if (!reference) return value;

  if (seen.has(name)) throw new Error(`Cycle at --${name}`);
  seen.add(name);

  return resolveToken(vars, reference[1], seen);
}
```

Modify `tsconfig.scripts.json` — change `"include": ["scripts"]` to:

```json
  "include": ["scripts", "tests"]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `P exec vp test --run tests/design-system/color.test.ts`
Expected: PASS (12 tests).

Run: `P exec tsc -p tsconfig.scripts.json`
Expected: no output, exit 0.

- [ ] **Step 5: Commit**

```bash
git add tests/design-system/color.ts tests/design-system/css-tokens.ts tests/design-system/color.test.ts tsconfig.scripts.json
git commit -m "test(design-system): add OKLCH contrast math and CSS token reader

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Raw palette + semantic tokens + contrast test

**Files:**
- Create: `src/styles/palette.css`
- Create: `src/styles/tokens.css`
- Test: `tests/design-system/contrast.test.ts`

**Interfaces:**
- Consumes (Task 1): `parseOklch`, `oklchToSrgb`, `contrastRatio`, `extractBlock`, `resolveToken`, `readProjectFile`.
- Produces: CSS custom properties `--graphite-1..12`, `--oxblood-1..12`, `--green-1..12`, `--amber-1..12`, `--vermilion-1..12`, `--steel-1..12` (palette.css) and the 33 semantic roles below plus `--elevation-raised`, `--elevation-overlay`, `--sidebar*`, `--code-*`, `--duration-fast|base|slow`, `--leading-rtl-boost` (tokens.css). Neither file is imported by the app yet (no visual change in this task).

Semantic roles (exact names, used by every later task): `canvas, surface-sunken, surface, surface-raised, overlay, fg, fg-muted, fg-subtle, fg-inverse, border, border-strong, border-subtle, inverse, inverse-fg, accent, accent-fg, accent-subtle, ring, ring-subtle, success, success-subtle, success-fg, warning, warning-subtle, warning-fg, danger, danger-subtle, danger-fg, info, info-subtle, info-fg, hover, pressed`.

- [ ] **Step 1: Write the failing test**

Create `tests/design-system/contrast.test.ts`:

```ts
import { describe, expect, it } from 'vite-plus/test';

import { contrastRatio, oklchToSrgb, parseOklch } from './color';
import { extractBlock, readProjectFile, resolveToken } from './css-tokens';

const TEXT = 4.5;
const UI = 3;

/** [foreground role, background role, minimum ratio] — spec §7.8.1 */
const PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ['fg', 'canvas', TEXT],
  ['fg', 'surface', TEXT],
  ['fg', 'surface-raised', TEXT],
  ['fg', 'surface-sunken', TEXT],
  ['fg-muted', 'canvas', TEXT],
  ['fg-muted', 'surface', TEXT],
  ['fg-muted', 'surface-raised', TEXT],
  ['fg-muted', 'surface-sunken', TEXT],
  ['accent', 'surface', TEXT],
  ['success', 'surface', TEXT],
  ['warning', 'surface', TEXT],
  ['danger', 'surface', TEXT],
  ['info', 'surface', TEXT],
  ['accent-fg', 'accent', TEXT],
  ['inverse-fg', 'inverse', TEXT],
  ['fg-inverse', 'inverse', TEXT],
  ['success-fg', 'success', TEXT],
  ['warning-fg', 'warning', TEXT],
  ['danger-fg', 'danger', TEXT],
  ['info-fg', 'info', TEXT],
  ['border-strong', 'surface', UI],
  ['ring', 'surface', UI],
  ['ring', 'canvas', UI],
  ['fg-subtle', 'surface', UI],
];

const tokensCss = readProjectFile('src/styles/tokens.css');

const opaqueRgb = (vars: Record<string, string>, role: string) => {
  const color = parseOklch(resolveToken(vars, role));
  expect(color.alpha, `--${role} must be opaque to be contrast-tested`).toBe(1);
  return oklchToSrgb(color);
};

describe('semantic token contrast (WCAG AA)', () => {
  it('declares light tokens on both :root and .light so light panels work inside the dark app', () => {
    expect(tokensCss).toContain(':root,\n.light {');
  });

  for (const mode of ['.light', '.dark'] as const) {
    describe(mode, () => {
      const vars = extractBlock(tokensCss, mode);

      for (const [foreground, background, minimum] of PAIRS) {
        it(`${foreground} on ${background} ≥ ${minimum}:1`, () => {
          const ratio = contrastRatio(opaqueRgb(vars, foreground), opaqueRgb(vars, background));
          expect(ratio).toBeGreaterThanOrEqual(minimum);
        });
      }
    });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run tests/design-system/contrast.test.ts`
Expected: FAIL — `ENOENT: no such file or directory … src/styles/tokens.css`.

- [ ] **Step 3: Write minimal implementation**

Create `src/styles/palette.css`:

```css
/* Layer 1 — raw palette (mode-independent OKLCH ramps, step 1 = lightest).
 * Components never use these directly; tokens.css and the legacy bridge do. */
:root {
  /* graphite */
  --graphite-1: oklch(0.98 0.003 266);
  --graphite-2: oklch(0.95 0.004 266);
  --graphite-3: oklch(0.9 0.005 266);
  --graphite-4: oklch(0.84 0.006 266);
  --graphite-5: oklch(0.76 0.008 266);
  --graphite-6: oklch(0.68 0.009 266);
  --graphite-7: oklch(0.6 0.011 266);
  --graphite-8: oklch(0.52 0.011 266);
  --graphite-9: oklch(0.44 0.01 266);
  --graphite-10: oklch(0.36 0.008 266);
  --graphite-11: oklch(0.28 0.007 266);
  --graphite-12: oklch(0.2 0.005 266);
  /* oxblood */
  --oxblood-1: oklch(0.98 0.008 14);
  --oxblood-2: oklch(0.95 0.024 14);
  --oxblood-3: oklch(0.9 0.052 14);
  --oxblood-4: oklch(0.84 0.078 14);
  --oxblood-5: oklch(0.76 0.098 14);
  --oxblood-6: oklch(0.68 0.117 14);
  --oxblood-7: oklch(0.6 0.138 14);
  --oxblood-8: oklch(0.52 0.142 14);
  --oxblood-9: oklch(0.44 0.122 14);
  --oxblood-10: oklch(0.36 0.102 14);
  --oxblood-11: oklch(0.28 0.082 14);
  --oxblood-12: oklch(0.2 0.062 14);
  /* green */
  --green-1: oklch(0.98 0.03 157);
  --green-2: oklch(0.95 0.047 157);
  --green-3: oklch(0.9 0.058 157);
  --green-4: oklch(0.84 0.072 157);
  --green-5: oklch(0.76 0.091 157);
  --green-6: oklch(0.68 0.11 157);
  --green-7: oklch(0.6 0.128 157);
  --green-8: oklch(0.52 0.123 157);
  --green-9: oklch(0.44 0.104 157);
  --green-10: oklch(0.36 0.086 157);
  --green-11: oklch(0.28 0.067 157);
  --green-12: oklch(0.2 0.05 157);
  /* amber */
  --amber-1: oklch(0.98 0.014 72);
  --amber-2: oklch(0.95 0.037 72);
  --amber-3: oklch(0.9 0.058 72);
  --amber-4: oklch(0.84 0.072 72);
  --amber-5: oklch(0.76 0.091 72);
  --amber-6: oklch(0.68 0.11 72);
  --amber-7: oklch(0.6 0.128 72);
  --amber-8: oklch(0.52 0.111 72);
  --amber-9: oklch(0.44 0.094 72);
  --amber-10: oklch(0.36 0.078 72);
  --amber-11: oklch(0.28 0.061 72);
  --amber-12: oklch(0.2 0.046 72);
  /* vermilion */
  --vermilion-1: oklch(0.98 0.01 36);
  --vermilion-2: oklch(0.95 0.025 36);
  --vermilion-3: oklch(0.9 0.053 36);
  --vermilion-4: oklch(0.84 0.088 36);
  --vermilion-5: oklch(0.76 0.124 36);
  --vermilion-6: oklch(0.68 0.149 36);
  --vermilion-7: oklch(0.6 0.174 36);
  --vermilion-8: oklch(0.52 0.178 36);
  --vermilion-9: oklch(0.44 0.151 36);
  --vermilion-10: oklch(0.36 0.124 36);
  --vermilion-11: oklch(0.28 0.098 36);
  --vermilion-12: oklch(0.2 0.075 36);
  /* steel */
  --steel-1: oklch(0.98 0.009 257);
  --steel-2: oklch(0.95 0.01 257);
  --steel-3: oklch(0.9 0.012 257);
  --steel-4: oklch(0.84 0.016 257);
  --steel-5: oklch(0.76 0.019 257);
  --steel-6: oklch(0.68 0.024 257);
  --steel-7: oklch(0.6 0.028 257);
  --steel-8: oklch(0.52 0.028 257);
  --steel-9: oklch(0.44 0.024 257);
  --steel-10: oklch(0.36 0.02 257);
  --steel-11: oklch(0.28 0.016 257);
  --steel-12: oklch(0.2 0.012 257);
}
```

Create `src/styles/tokens.css`:

```css
/*
 * Layer 2 — semantic tokens. The ONLY colors components may use (exposed by theme.css).
 * Light values live on `:root, .light`; dark on `.dark` (dark is the default via ThemeProvider).
 * Contrast is enforced by tests/design-system/contrast.test.ts.
 */
:root,
.light {
  --canvas: oklch(0.991 0.001 286.4);
  --surface-sunken: oklch(0.974 0.003 286.4);
  --surface: oklch(1 0 0);
  --surface-raised: oklch(1 0 0);
  --overlay: oklch(0.205 0.006 271.1 / 40%);

  --fg: oklch(0.205 0.006 271.1);
  --fg-muted: oklch(0.544 0.015 262.3);
  --fg-subtle: oklch(0.656 0.012 264.5);
  --fg-inverse: oklch(1 0 0);

  --border: oklch(0.919 0.006 275);
  --border-strong: oklch(0.657 0.009 271.3);
  --border-subtle: oklch(0.952 0.004 271.4);

  --inverse: oklch(0.205 0.006 271.1);
  --inverse-fg: oklch(1 0 0);

  --accent: oklch(0.43 0.141 14.9);
  --accent-fg: oklch(1 0 0);
  --accent-subtle: oklch(0.953 0.013 5.8);
  --ring: var(--accent);
  --ring-subtle: oklch(0.43 0.141 14.9 / 20%);

  --success: oklch(0.536 0.137 157.2);
  --success-subtle: oklch(0.964 0.018 161.1);
  --success-fg: oklch(1 0 0);
  --warning: oklch(0.561 0.125 70.4);
  --warning-subtle: oklch(0.972 0.022 83.3);
  --warning-fg: oklch(1 0 0);
  --danger: oklch(0.576 0.184 35.5);
  --danger-subtle: oklch(0.957 0.018 39.4);
  --danger-fg: oklch(1 0 0);
  --info: oklch(0.503 0.026 256.8);
  --info-subtle: oklch(0.957 0.005 258.3);
  --info-fg: oklch(1 0 0);

  --hover: oklch(0.205 0.006 271.1 / 4%);
  --pressed: oklch(0.205 0.006 271.1 / 8%);

  --elevation-raised: 0 8px 24px -8px oklch(0.205 0.006 271.1 / 16%), 0 0 0 1px var(--border);
  --elevation-overlay: 0 24px 56px -12px oklch(0.205 0.006 271.1 / 24%), 0 0 0 1px var(--border);

  --sidebar: var(--surface-sunken);
  --sidebar-foreground: var(--fg-muted);
  --sidebar-accent: var(--hover);
  --sidebar-accent-foreground: var(--fg);
  --sidebar-border: var(--border);

  --code-surface: var(--graphite-12);
  --code-foreground: var(--graphite-3);
  --code-muted: var(--graphite-6);
}

.dark {
  --canvas: oklch(0.173 0.004 264.5);
  --surface-sunken: oklch(0.159 0.005 264.4);
  --surface: oklch(0.196 0.006 271.1);
  --surface-raised: oklch(0.222 0.006 271.1);
  --overlay: oklch(0 0 0 / 70%);

  --fg: oklch(0.928 0.003 264.5);
  --fg-muted: oklch(0.649 0.015 262.4);
  --fg-subtle: oklch(0.511 0.016 262.3);
  --fg-inverse: oklch(0.173 0.004 264.5);

  --border: oklch(0.277 0.01 268.3);
  --border-strong: oklch(0.508 0.011 271.1);
  --border-subtle: oklch(0.239 0.008 264.4);

  --inverse: oklch(0.928 0.003 264.5);
  --inverse-fg: oklch(0.173 0.004 264.5);

  --accent: oklch(0.698 0.125 12);
  --accent-fg: oklch(0.173 0.004 264.5);
  --accent-subtle: oklch(0.698 0.125 12 / 11%);
  --ring: var(--accent);
  --ring-subtle: oklch(0.698 0.125 12 / 25%);

  --success: oklch(0.735 0.136 159.3);
  --success-subtle: oklch(0.735 0.136 159.3 / 12%);
  --success-fg: oklch(0.173 0.004 264.5);
  --warning: oklch(0.773 0.14 78.6);
  --warning-subtle: oklch(0.773 0.14 78.6 / 12%);
  --warning-fg: oklch(0.173 0.004 264.5);
  --danger: oklch(0.704 0.192 37.1);
  --danger-subtle: oklch(0.704 0.192 37.1 / 12%);
  --danger-fg: oklch(0.173 0.004 264.5);
  --info: oklch(0.715 0.023 256.8);
  --info-subtle: oklch(0.715 0.023 256.8 / 12%);
  --info-fg: oklch(0.173 0.004 264.5);

  --hover: oklch(0.928 0.003 264.5 / 5%);
  --pressed: oklch(0.928 0.003 264.5 / 9%);

  --elevation-raised: 0 12px 32px -8px oklch(0 0 0 / 45%), 0 0 0 1px var(--border);
  --elevation-overlay: 0 24px 64px -12px oklch(0 0 0 / 60%), 0 0 0 1px var(--border);

  --sidebar: var(--surface-sunken);
  --sidebar-foreground: var(--fg-muted);
  --sidebar-accent: var(--hover);
  --sidebar-accent-foreground: var(--fg);
  --sidebar-border: var(--border);

  --code-surface: var(--surface-sunken);
  --code-foreground: var(--graphite-3);
  --code-muted: var(--graphite-7);
}

:root {
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 260ms;
  --leading-rtl-boost: 0em;
}

[dir='rtl'] {
  --leading-rtl-boost: 0.2em;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `P exec vp test --run tests/design-system/contrast.test.ts`
Expected: PASS (49 tests: 1 selector check + 24 pairs × 2 modes). The tightest pairs are `border-strong` on `surface` (≈3.15) and light `fg-muted` on `surface-sunken` (≈4.61).

- [ ] **Step 5: Commit**

```bash
git add src/styles/palette.css src/styles/tokens.css tests/design-system/contrast.test.ts
git commit -m "feat(design-system): add Graphite/Oxblood palette and semantic tokens

Contrast-tested in both modes (WCAG AA text 4.5:1, UI 3:1). Not imported yet.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Wire tokens into Tailwind, add the legacy bridge, migrate the flipped `accent` usages

This is the first visible change: the app turns Graphite/Oxblood, while every old class keeps working through the legacy bridge.

**Files:**
- Create: `src/lib/constants/DesignTokens.ts`
- Modify: `src/lib/constants/index.ts`
- Create: `src/styles/theme.css`
- Create: `src/styles/legacy-tokens.css`
- Modify: `src/index.css` (full rewrite below)
- Modify (accent migration): `src/components/ui/dropdown-menu/DropdownMenu.tsx:67,127,148`, `src/components/ui/calendar/Calendar.tsx:42,202,204,205`, `src/components/ui/toggle-group/ToggleGroup.tsx:30`, `src/components/ui/progress/Progress.tsx:24`, `src/components/ui/chip/Chip.tsx:21`, `src/components/shared/prime-card/PrimeCard.tsx:47`, `src/components/shared/collapsible-card/CollapsibleCard.tsx:69`, `src/layouts/dashboard-header/DashboardHeader.tsx:32`, `src/layouts/dashboard-sidebar-drawer/DashboardSidebarDrawer.tsx:41`, `src/component-docs/calendar/CalendarGrid.mdx:462`
- Test: `tests/design-system/theme-contract.test.ts`

**Interfaces:**
- Consumes (Task 2): all semantic role CSS variables; (Task 1): `extractBlock`, `readProjectFile`.
- Produces:
  - `SEMANTIC_COLOR_ROLES: ReadonlyArray<{ token: string; group: ColorRoleGroup; description: string }>` and `type ColorRoleGroup = 'surface' | 'text' | 'line' | 'action' | 'accent' | 'status' | 'state'` exported from `src/lib/constants/DesignTokens.ts` (re-exported via `@constants`).
  - Tailwind color utilities `bg-|text-|border-|ring-…` for every role (e.g. `bg-canvas`, `text-fg-muted`, `border-border-strong`, `bg-accent-subtle`, `bg-hover`).
  - `src/styles/theme.css` with a `/* fonts + type scale */` section (replaced in Task 4) and `--color-*` section.

- [ ] **Step 1: Write the failing test**

Create `tests/design-system/theme-contract.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { SEMANTIC_COLOR_ROLES } from '../../src/lib/constants/DesignTokens';
import { extractBlock, readProjectFile } from './css-tokens';

const SRC_DIR = fileURLToPath(new URL('../../src/', import.meta.url));

const tokensCss = readProjectFile('src/styles/tokens.css');
const themeCss = readProjectFile('src/styles/theme.css');
const indexCss = readProjectFile('src/index.css');

const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });

describe('semantic color roles', () => {
  for (const mode of ['.light', '.dark'] as const) {
    it(`defines every role in ${mode}`, () => {
      const vars = extractBlock(tokensCss, mode);
      const missing = SEMANTIC_COLOR_ROLES.map((role) => role.token).filter((token) => !(token in vars));
      expect(missing).toEqual([]);
    });
  }

  it('exposes every role as a Tailwind color', () => {
    const missing = SEMANTIC_COLOR_ROLES.map((role) => role.token).filter(
      (token) => !themeCss.includes(`--color-${token}: var(--${token});`),
    );
    expect(missing).toEqual([]);
  });

  it('resets the default Tailwind palette before any color is defined', () => {
    expect(themeCss.indexOf('--color-*: initial;')).toBeGreaterThan(-1);
    expect(themeCss.indexOf('--color-*: initial;')).toBeLessThan(themeCss.indexOf('--color-canvas'));
  });
});

describe('index.css import order', () => {
  it('imports palette → tokens → theme → legacy bridge', () => {
    const order = ['./styles/palette.css', './styles/tokens.css', './styles/theme.css', './styles/legacy-tokens.css'].map((file) =>
      indexCss.indexOf(`@import '${file}';`),
    );
    order.forEach((position) => expect(position).toBeGreaterThan(-1));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('legacy accent migration', () => {
  it('leaves no usage of the old soft-hover accent utilities in src/', () => {
    const legacyAccent = /\b(?:bg|text|border|ring)-accent-(?:foreground|200|300|400)\b|(?:focus|hover|data-\[[^\]]+\]):bg-accent(?![-\w])/;
    const offenders = listFiles(SRC_DIR)
      .filter((file) => /\.(tsx|ts|mdx)$/.test(file))
      .filter((file) => legacyAccent.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(SRC_DIR, 'src/'));
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run tests/design-system/theme-contract.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/lib/constants/DesignTokens"`.

- [ ] **Step 3: Create the roles constant**

Create `src/lib/constants/DesignTokens.ts`:

```ts
export type ColorRoleGroup = 'surface' | 'text' | 'line' | 'action' | 'accent' | 'status' | 'state';

export type SemanticColorRole = Readonly<{
  token: string;
  group: ColorRoleGroup;
  description: string;
}>;

export const SEMANTIC_COLOR_ROLES: ReadonlyArray<SemanticColorRole> = [
  { token: 'canvas', group: 'surface', description: 'App background' },
  { token: 'surface-sunken', group: 'surface', description: 'Sidebar, wells, code blocks' },
  { token: 'surface', group: 'surface', description: 'Cards and controls' },
  { token: 'surface-raised', group: 'surface', description: 'Menus, popovers, toasts' },
  { token: 'overlay', group: 'surface', description: 'Dialog and sheet scrim' },
  { token: 'fg', group: 'text', description: 'Primary text' },
  { token: 'fg-muted', group: 'text', description: 'Secondary text, placeholders' },
  { token: 'fg-subtle', group: 'text', description: 'Disabled text, decorative meta (≥3:1)' },
  { token: 'fg-inverse', group: 'text', description: 'Text on inverse surfaces' },
  { token: 'border', group: 'line', description: 'Decorative lines: cards, dividers' },
  { token: 'border-strong', group: 'line', description: 'Control boundaries (≥3:1)' },
  { token: 'border-subtle', group: 'line', description: 'Table row lines' },
  { token: 'inverse', group: 'action', description: 'Primary action fill' },
  { token: 'inverse-fg', group: 'action', description: 'Text on primary action' },
  { token: 'accent', group: 'accent', description: 'Oxblood: links, selection, focus' },
  { token: 'accent-fg', group: 'accent', description: 'Text on accent fill' },
  { token: 'accent-subtle', group: 'accent', description: 'Selection tint' },
  { token: 'ring', group: 'accent', description: 'Focus outline (solid, ≥3:1)' },
  { token: 'ring-subtle', group: 'accent', description: 'Focus glow (decorative)' },
  { token: 'success', group: 'status', description: 'Success text and fill' },
  { token: 'success-subtle', group: 'status', description: 'Success tint' },
  { token: 'success-fg', group: 'status', description: 'Text on success fill' },
  { token: 'warning', group: 'status', description: 'Warning text and fill' },
  { token: 'warning-subtle', group: 'status', description: 'Warning tint' },
  { token: 'warning-fg', group: 'status', description: 'Text on warning fill' },
  { token: 'danger', group: 'status', description: 'Vermilion: errors and destructive actions' },
  { token: 'danger-subtle', group: 'status', description: 'Danger tint' },
  { token: 'danger-fg', group: 'status', description: 'Text on danger fill' },
  { token: 'info', group: 'status', description: 'Steel: informational text and fill' },
  { token: 'info-subtle', group: 'status', description: 'Info tint' },
  { token: 'info-fg', group: 'status', description: 'Text on info fill' },
  { token: 'hover', group: 'state', description: 'Hover overlay' },
  { token: 'pressed', group: 'state', description: 'Pressed overlay' },
];
```

Modify `src/lib/constants/index.ts` — append:

```ts
export * from './DesignTokens';
```

- [ ] **Step 4: Create theme.css and the legacy bridge**

Create `src/styles/theme.css`:

```css
/*
 * Tailwind theme — exposes the semantic layer (tokens.css) and the foundation scales as utilities.
 * Must be imported BEFORE legacy-tokens.css: `--color-*: initial` clears Tailwind's default palette,
 * and a later reset would also wipe the legacy colors.
 */
@theme inline {
  --color-*: initial;

  --color-canvas: var(--canvas);
  --color-surface-sunken: var(--surface-sunken);
  --color-surface: var(--surface);
  --color-surface-raised: var(--surface-raised);
  --color-overlay: var(--overlay);

  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-fg-inverse: var(--fg-inverse);

  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-border-subtle: var(--border-subtle);

  --color-inverse: var(--inverse);
  --color-inverse-fg: var(--inverse-fg);

  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-fg);
  --color-accent-subtle: var(--accent-subtle);
  --color-ring: var(--ring);
  --color-ring-subtle: var(--ring-subtle);

  --color-success: var(--success);
  --color-success-subtle: var(--success-subtle);
  --color-success-fg: var(--success-fg);
  --color-warning: var(--warning);
  --color-warning-subtle: var(--warning-subtle);
  --color-warning-fg: var(--warning-fg);
  --color-danger: var(--danger);
  --color-danger-subtle: var(--danger-subtle);
  --color-danger-fg: var(--danger-fg);
  --color-info: var(--info);
  --color-info-subtle: var(--info-subtle);
  --color-info-fg: var(--info-fg);

  --color-hover: var(--hover);
  --color-pressed: var(--pressed);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-code-surface: var(--code-surface);
  --color-code-foreground: var(--code-foreground);
  --color-code-muted: var(--code-muted);

  /* fonts + type scale (pre-redesign values; replaced in Task 4) */
  --font-family-sans: 'DM Sans', 'IBM Plex Sans Arabic', sans-serif;
  --text-*: initial;
  --text-2xs: 0.625rem;
  --text-2xs--line-height: 1rem;
  --text-xs: 0.75rem;
  --text-xs--line-height: 1.125rem;
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
  --text-base: 1rem;
  --text-base--line-height: 1.5rem;
  --text-lg: 1.125rem;
  --text-lg--line-height: 1.625rem;
  --text-xl: 1.25rem;
  --text-xl--line-height: 1.75rem;
  --text-2xl: 1.5rem;
  --text-2xl--line-height: 2rem;
}
```

Create `src/styles/legacy-tokens.css`:

```css
/*
 * LEGACY BRIDGE — temporary. Keeps pre-redesign token names (primary-*, secondary-*, muted-*,
 * destructive-*, success-/warning- ramps, background/foreground, popover, legacy shadows) working
 * by pointing them at the new palette, so Foundations ships without breaking any component.
 * Sub-project 2 (Primitives) migrates every usage and deletes this file.
 * Do not use any name defined here in new code (enforced by tests/design-system/forbidden-patterns.test.ts).
 */
:root,
.light {
  --background: var(--canvas);
  --foreground: var(--fg);
  --primary: var(--accent);
  --primary-foreground: var(--accent-fg);
  --secondary: var(--surface-raised);
  --secondary-foreground: var(--fg);
  --muted: var(--border-strong);
  --muted-foreground: var(--fg-muted);
  --destructive: var(--danger);
  --destructive-foreground: var(--danger-fg);
  --success-foreground: var(--success-fg);
  --warning-foreground: var(--warning-fg);
  --popover: var(--surface-raised);
  --popover-foreground: var(--fg);
  --primary-15: var(--oxblood-1);
  --primary-25: var(--oxblood-2);
  --primary-50: var(--oxblood-2);
  --primary-100: var(--oxblood-3);
  --primary-200: var(--oxblood-5);
  --primary-300: var(--oxblood-6);
  --primary-400: var(--oxblood-7);
  --primary-600: var(--oxblood-8);
  --primary-700: var(--oxblood-9);
  --primary-800: var(--oxblood-10);
  --primary-900: var(--oxblood-11);
  --secondary-15: var(--graphite-1);
  --secondary-25: var(--graphite-1);
  --secondary-50: var(--graphite-1);
  --secondary-100: var(--graphite-1);
  --secondary-200: var(--graphite-2);
  --secondary-300: var(--graphite-3);
  --secondary-400: var(--graphite-4);
  --secondary-600: var(--graphite-7);
  --secondary-700: var(--graphite-8);
  --secondary-800: var(--graphite-10);
  --secondary-900: var(--graphite-11);
  --muted-50: var(--graphite-1);
  --muted-100: var(--graphite-1);
  --muted-200: var(--graphite-3);
  --muted-300: var(--graphite-9);
  --muted-400: var(--graphite-8);
  --success-200: var(--green-1);
  --success-300: var(--green-2);
  --success-400: var(--green-4);
  --destructive-200: var(--vermilion-2);
  --destructive-300: var(--vermilion-3);
  --destructive-400: var(--vermilion-6);
  --warning-200: var(--amber-1);
  --warning-300: var(--amber-2);
  --warning-400: var(--amber-3);
}

.dark {
  --primary-15: var(--oxblood-11);
  --primary-25: var(--oxblood-11);
  --primary-50: var(--oxblood-10);
  --primary-100: var(--oxblood-10);
  --primary-200: var(--oxblood-9);
  --primary-300: var(--oxblood-8);
  --primary-400: var(--oxblood-7);
  --primary-600: var(--oxblood-6);
  --primary-700: var(--oxblood-5);
  --primary-800: var(--oxblood-4);
  --primary-900: var(--oxblood-3);
  --secondary-15: var(--graphite-12);
  --secondary-25: var(--graphite-12);
  --secondary-50: var(--graphite-12);
  --secondary-100: var(--graphite-12);
  --secondary-200: var(--graphite-11);
  --secondary-300: var(--graphite-11);
  --secondary-400: var(--graphite-10);
  --secondary-600: var(--graphite-7);
  --secondary-700: var(--graphite-6);
  --secondary-800: var(--graphite-5);
  --secondary-900: var(--graphite-3);
  --muted-50: var(--graphite-12);
  --muted-100: var(--graphite-12);
  --muted-200: var(--graphite-11);
  --muted-300: var(--graphite-7);
  --muted-400: var(--graphite-6);
  --success-200: var(--green-12);
  --success-300: var(--green-10);
  --success-400: var(--green-7);
  --destructive-200: var(--vermilion-12);
  --destructive-300: var(--vermilion-10);
  --destructive-400: var(--vermilion-8);
  --warning-200: var(--amber-11);
  --warning-300: var(--amber-9);
  --warning-400: var(--amber-6);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-15: var(--primary-15);
  --color-primary-25: var(--primary-25);
  --color-primary-50: var(--primary-50);
  --color-primary-100: var(--primary-100);
  --color-primary-200: var(--primary-200);
  --color-primary-300: var(--primary-300);
  --color-primary-400: var(--primary-400);
  --color-primary-600: var(--primary-600);
  --color-primary-700: var(--primary-700);
  --color-primary-800: var(--primary-800);
  --color-primary-900: var(--primary-900);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-15: var(--secondary-15);
  --color-secondary-25: var(--secondary-25);
  --color-secondary-50: var(--secondary-50);
  --color-secondary-100: var(--secondary-100);
  --color-secondary-200: var(--secondary-200);
  --color-secondary-300: var(--secondary-300);
  --color-secondary-400: var(--secondary-400);
  --color-secondary-600: var(--secondary-600);
  --color-secondary-700: var(--secondary-700);
  --color-secondary-800: var(--secondary-800);
  --color-secondary-900: var(--secondary-900);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-50: var(--muted-50);
  --color-muted-100: var(--muted-100);
  --color-muted-200: var(--muted-200);
  --color-muted-300: var(--muted-300);
  --color-muted-400: var(--muted-400);
  --color-muted-foreground: var(--muted-foreground);
  --color-success-200: var(--success-200);
  --color-success-300: var(--success-300);
  --color-success-400: var(--success-400);
  --color-success-foreground: var(--success-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-200: var(--destructive-200);
  --color-destructive-300: var(--destructive-300);
  --color-destructive-400: var(--destructive-400);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-warning-200: var(--warning-200);
  --color-warning-300: var(--warning-300);
  --color-warning-400: var(--warning-400);
  --color-warning-foreground: var(--warning-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --shadow:
    0 1px 3px 0 color-mix(in oklch, var(--fg) 6%, transparent),
    0 1px 2px -1px color-mix(in oklch, var(--fg) 4%, transparent);
  --shadow-boundary:
    0 0 0 1px color-mix(in oklch, var(--fg) 8%, transparent), 0 0 0 2px color-mix(in oklch, var(--fg) 4%, transparent);
  --shadow-boundary-ghost: 0 0 12px -4px color-mix(in oklch, var(--fg) 3%, transparent);
  --shadow-inner:
    0 0 1px 0 color-mix(in oklch, var(--fg) 12%, transparent), 0 0 2px 0 color-mix(in oklch, var(--fg) 8%, transparent);
  --shadow-spread: 0 4px 24px -4px color-mix(in oklch, var(--fg) 5%, transparent);
  --shadow-deep: 0 8px 40px -8px color-mix(in oklch, var(--fg) 8%, transparent);

  --animate-prime-loader-move: prime-loader-move 3s linear infinite;
  @keyframes prime-loader-move {
    to {
      stroke-dashoffset: -1200;
    }
  }
}
```

- [ ] **Step 5: Rewrite `src/index.css`**

Replace the entire file with:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

@import 'tailwindcss';
@import 'tw-animate-css';

@import './styles/palette.css';
@import './styles/tokens.css';
@import './styles/theme.css';
@import './styles/legacy-tokens.css';

@custom-variant dark (&:is(.dark *));

@layer base {
  body {
    @apply bg-canvas text-fg font-family-sans max-w-[100dvw] overflow-x-hidden;
  }

  *::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    @apply bg-border-strong rounded-full;
  }

  ::selection {
    @apply bg-accent text-accent-fg;
  }

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }

  /* Rehype Pretty Code — dual theme switching */
  [data-rehype-pretty-code-figure] code {
    counter-reset: line;
  }

  [data-rehype-pretty-code-figure] code > [data-line] {
    padding: 0 1rem;
  }

  /* Light mode: show light theme colors, hide dark */
  [data-rehype-pretty-code-figure] code [style*='--shiki-dark'] {
    color: var(--shiki-light) !important;
  }

  /* Dark mode: show dark theme colors */
  .dark [data-rehype-pretty-code-figure] code [style*='--shiki-dark'] {
    color: var(--shiki-dark) !important;
  }
}
```

- [ ] **Step 6: Migrate the flipped `accent` usages**

Make exactly these replacements (each `old` string is unique in its file):

| File | Old | New |
|---|---|---|
| `src/components/ui/dropdown-menu/DropdownMenu.tsx` (line 67) | `focus:bg-accent data-[state=open]:bg-accent` | `focus:bg-hover data-[state=open]:bg-hover` |
| same file (lines 127 and 148 — replace both) | `focus:bg-accent focus:text-accent-foreground` | `focus:bg-hover focus:text-fg` |
| `src/components/ui/calendar/Calendar.tsx` (line 42) | `data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground` | `data-[range-middle=true]:bg-accent-subtle data-[range-middle=true]:text-fg` |
| same file (line 202) | `cn('rounded-s-md bg-accent', defaultClassNames.range_start)` | `cn('rounded-s-md bg-accent-subtle', defaultClassNames.range_start)` |
| same file (line 204) | `cn('rounded-e-md bg-accent', defaultClassNames.range_end)` | `cn('rounded-e-md bg-accent-subtle', defaultClassNames.range_end)` |
| same file (line 205) | `cn('bg-accent text-accent-foreground rounded-md', defaultClassNames.today)` | `cn('bg-hover text-fg rounded-md', defaultClassNames.today)` |
| `src/components/ui/toggle-group/ToggleGroup.tsx` (line 30) | `'border border-accent text-accent-foreground bg-transparent shadow-xs hover:bg-accent'` | `'border border-border-strong text-fg bg-transparent shadow-xs hover:bg-hover'` |
| `src/components/ui/progress/Progress.tsx` (line 24, the **track** variants) | `default: 'bg-accent',` | `default: 'bg-border',` |
| `src/components/ui/chip/Chip.tsx` (line 21) | `accent: 'bg-accent-200 text-accent-foreground hover:bg-accent-400',` | `accent: 'bg-info-subtle text-fg hover:bg-hover',` |
| `src/components/shared/prime-card/PrimeCard.tsx` (line 47) | `info: 'bg-accent-200',` | `info: 'bg-info-subtle',` |
| `src/components/shared/collapsible-card/CollapsibleCard.tsx` (line 69) | `info: 'bg-accent-200',` | `info: 'bg-info-subtle',` |
| `src/layouts/dashboard-header/DashboardHeader.tsx` (line 32) | `hover:bg-accent hover:text-foreground` | `hover:bg-hover hover:text-foreground` |
| `src/layouts/dashboard-sidebar-drawer/DashboardSidebarDrawer.tsx` (line 41) | `hover:bg-accent hover:text-foreground` | `hover:bg-hover hover:text-foreground` |
| `src/component-docs/calendar/CalendarGrid.mdx` (line 462) | `colorClass: 'bg-accent-200'` | `colorClass: 'bg-info-subtle'` |

Leave unchanged on purpose: `Progress.tsx` line 43 (indicator `accent: 'bg-accent'` — now Oxblood, as intended) and `FileCard.mdx` line 24 (`dotClass: 'bg-accent'` — Oxblood dot, as intended).

- [ ] **Step 7: Run tests to verify they pass**

Run: `P exec vp test --run tests/design-system`
Expected: PASS (all of Task 1–3 tests).

Run: `P exec tsc -b && P exec vp build`
Expected: both exit 0; `vp build` prints `✓ built in`.

- [ ] **Step 8: Visual spot check**

Run the dev server: `P exec vp dev --open false --port 3123` (background). Open `http://localhost:3123/components` with the playwright-cli skill, screenshot in dark (default) and light (`localStorage.setItem('vite-ui-theme','light')`, reload). Expected: graphite surfaces, Oxblood primary buttons/links, menus highlight with a neutral hover (not solid Oxblood), calendar ranges tinted not filled. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add src/styles/theme.css src/styles/legacy-tokens.css src/index.css src/lib/constants/DesignTokens.ts src/lib/constants/index.ts tests/design-system/theme-contract.test.ts src/components src/layouts src/component-docs/calendar/CalendarGrid.mdx
git commit -m "feat(design-system): switch app to Graphite/Oxblood semantic tokens

Expose semantic roles via theme.css, bridge legacy token names onto the
new palette, and migrate the 25 legacy accent usages whose meaning flips.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Typography — Schibsted Grotesk, Noto Kufi Arabic, Spline Sans Mono, new type scale

**Files:**
- Modify: `src/index.css` (font import line, body `@apply`)
- Modify: `src/styles/theme.css` (replace the `/* fonts + type scale … */` section)
- Modify: `src/lib/constants/DesignTokens.ts` (add `TEXT_SCALE`, `FONT_FAMILIES`)
- Modify: `src/pages/home/HomePage.tsx`, `src/views/home/component-showcase/ComponentShowcase.tsx` (remove the Fraunces inline style)
- Test: `tests/design-system/theme-contract.test.ts` (add `describe('typography')`)

**Interfaces:**
- Consumes: Task 3 `theme.css` section marker, `DesignTokens.ts`.
- Produces:
  - `TEXT_SCALE: ReadonlyArray<{ token: string; size: string; lineHeight: string; px: number; use: string }>`
  - `FONT_FAMILIES: Readonly<{ sans: string; mono: string }>`
  - Utilities `font-sans`, `font-mono`, `text-2xs … text-2xl` (incl. new `text-md`).

- [ ] **Step 1: Write the failing test**

Append to `tests/design-system/theme-contract.test.ts` (add `FONT_FAMILIES, TEXT_SCALE` to the existing `DesignTokens` import):

```ts
describe('typography', () => {
  it('loads exactly the three approved families', () => {
    const fontImport = indexCss.split('\n')[0];
    expect(fontImport).toContain('family=Schibsted+Grotesk');
    expect(fontImport).toContain('family=Noto+Kufi+Arabic');
    expect(fontImport).toContain('family=Spline+Sans+Mono');
    expect(fontImport).not.toMatch(/DM\+Sans|Fraunces|IBM\+Plex/);
  });

  it('exposes the sans and mono stacks', () => {
    expect(themeCss).toContain(`--font-sans: ${FONT_FAMILIES.sans};`);
    expect(themeCss).toContain(`--font-mono: ${FONT_FAMILIES.mono};`);
    expect(themeCss).not.toContain('--font-family-sans');
  });

  for (const step of TEXT_SCALE) {
    it(`defines ${step.token} = ${step.px}px with an RTL-aware line height`, () => {
      expect(themeCss).toContain(`--${step.token}: ${step.size};`);
      expect(themeCss).toContain(`--${step.token}--line-height: calc(${step.lineHeight} + var(--leading-rtl-boost));`);
    });
  }

  it('boosts leading only under [dir=rtl]', () => {
    expect(extractBlock(tokensCss, ':root')['leading-rtl-boost']).toBe('0em');
    expect(extractBlock(tokensCss, "[dir='rtl']")['leading-rtl-boost']).toBe('0.2em');
  });

  it('uses the sans stack on body', () => {
    expect(indexCss).toContain('@apply bg-canvas text-fg font-sans');
  });
});
```

> The `:root` lookup finds the standalone `:root {` block (durations + RTL var): `extractBlock` searches for `":root {"`, and the light block's header is `":root,\n.light {"`, so it cannot match.

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run tests/design-system/theme-contract.test.ts`
Expected: FAIL — `FONT_FAMILIES` / `TEXT_SCALE` not exported, and font import assertions fail.

- [ ] **Step 3: Add the scale constants**

Append to `src/lib/constants/DesignTokens.ts`:

```ts
export type TextScaleStep = Readonly<{
  token: string;
  size: string;
  lineHeight: string;
  px: number;
  use: string;
}>;

export const TEXT_SCALE: ReadonlyArray<TextScaleStep> = [
  { token: 'text-2xs', size: '0.6875rem', lineHeight: '1rem', px: 11, use: 'Meta, shortcut hints' },
  { token: 'text-xs', size: '0.75rem', lineHeight: '1rem', px: 12, use: 'Labels, table headers, badges' },
  { token: 'text-sm', size: '0.8125rem', lineHeight: '1.25rem', px: 13, use: 'Dense UI, table cells' },
  { token: 'text-base', size: '0.875rem', lineHeight: '1.375rem', px: 14, use: 'Body and controls (default)' },
  { token: 'text-md', size: '1rem', lineHeight: '1.5rem', px: 16, use: 'Card titles' },
  { token: 'text-lg', size: '1.125rem', lineHeight: '1.625rem', px: 18, use: 'Section titles' },
  { token: 'text-xl', size: '1.375rem', lineHeight: '1.75rem', px: 22, use: 'Page titles' },
  { token: 'text-2xl', size: '1.75rem', lineHeight: '2.125rem', px: 28, use: 'Stat values, display' },
];

export const FONT_FAMILIES = {
  sans: "'Schibsted Grotesk', 'Noto Kufi Arabic', system-ui, sans-serif",
  mono: "'Spline Sans Mono', ui-monospace, 'SFMono-Regular', monospace",
} as const;
```

- [ ] **Step 4: Replace the fonts + type section in theme.css**

In `src/styles/theme.css`, replace everything from the line `/* fonts + type scale (pre-redesign values; replaced in Task 4) */` through `--text-2xl--line-height: 2rem;` with:

```css
  /* fonts — per-glyph fallback: Latin + digits render in Schibsted, Arabic in Noto Kufi */
  --font-sans: 'Schibsted Grotesk', 'Noto Kufi Arabic', system-ui, sans-serif;
  --font-mono: 'Spline Sans Mono', ui-monospace, 'SFMono-Regular', monospace;

  /* type scale — line heights grow by --leading-rtl-boost under [dir='rtl'] (tokens.css) */
  --text-*: initial;
  --text-2xs: 0.6875rem;
  --text-2xs--line-height: calc(1rem + var(--leading-rtl-boost));
  --text-xs: 0.75rem;
  --text-xs--line-height: calc(1rem + var(--leading-rtl-boost));
  --text-sm: 0.8125rem;
  --text-sm--line-height: calc(1.25rem + var(--leading-rtl-boost));
  --text-base: 0.875rem;
  --text-base--line-height: calc(1.375rem + var(--leading-rtl-boost));
  --text-md: 1rem;
  --text-md--line-height: calc(1.5rem + var(--leading-rtl-boost));
  --text-lg: 1.125rem;
  --text-lg--line-height: calc(1.625rem + var(--leading-rtl-boost));
  --text-xl: 1.375rem;
  --text-xl--line-height: calc(1.75rem + var(--leading-rtl-boost));
  --text-2xl: 1.75rem;
  --text-2xl--line-height: calc(2.125rem + var(--leading-rtl-boost));
```

- [ ] **Step 5: Switch the font import and body stack**

In `src/index.css`, replace line 1 with:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600&family=Schibsted+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');
```

In the `body` rule replace `@apply bg-canvas text-fg font-family-sans max-w-[100dvw] overflow-x-hidden;` with:

```css
    @apply bg-canvas text-fg font-sans max-w-[100dvw] overflow-x-hidden;
```

and add, directly after the `body { … }` rule inside `@layer base`:

```css
  [dir='rtl'] body {
    line-height: 1.7;
  }
```

- [ ] **Step 6: Remove the Fraunces inline styles**

In `src/pages/home/HomePage.tsx` and `src/views/home/component-showcase/ComponentShowcase.tsx`:
1. Delete the line `const display: CSSProperties = { fontFamily: "'Fraunces', Georgia, serif" };`
2. Delete every ` style={display}` attribute (find with `grep -n "style={display}" <file>`).
3. If `CSSProperties` is no longer used in the file, remove it from the `react` type import.

Run: `grep -rn "Fraunces\|style={display}" src` — Expected: no output.

- [ ] **Step 7: Run tests to verify they pass**

Run: `P exec vp test --run tests/design-system && P exec tsc -b && P exec vp lint src/pages/home src/views/home`
Expected: tests PASS; tsc exit 0; lint `Found 0 errors`.

- [ ] **Step 8: Commit**

```bash
git add src/index.css src/styles/theme.css src/lib/constants/DesignTokens.ts src/pages/home/HomePage.tsx src/views/home/component-showcase/ComponentShowcase.tsx tests/design-system/theme-contract.test.ts
git commit -m "feat(design-system): adopt Schibsted Grotesk + Noto Kufi Arabic type system

14px body scale with text-md, Spline Sans Mono for data, tabular numbers,
and an RTL leading boost. Drops DM Sans, Fraunces and IBM Plex Sans Arabic.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Shape, density, elevation, motion and interaction states

**Files:**
- Modify: `src/styles/theme.css` (append radius, control sizes, easing inside `@theme inline`)
- Create: `src/styles/utilities.css`
- Modify: `src/index.css` (import utilities.css)
- Modify: `src/lib/constants/DesignTokens.ts` (add `RADIUS_SCALE`, `CONTROL_SIZES`, `ELEVATIONS`, `DURATIONS`, `STATE_UTILITIES`)
- Test: `tests/design-system/theme-contract.test.ts` (add `describe('shape, motion and states')`)

**Interfaces:**
- Consumes: Task 2 `--elevation-*`, `--duration-*`, `--ring`, `--ring-subtle`, `--danger`, `--danger-subtle`.
- Produces utilities: `rounded-sm|md|lg` (4/6/10px), `h-control-sm|md|lg` (and every spacing utility with those keys), `ease-out`, `shadow-raised`, `shadow-overlay`, `duration-fast|base|slow`, `focus-ring`, `focus-ring-input`, `state-invalid`, `state-press`; constants `RADIUS_SCALE`, `CONTROL_SIZES`, `ELEVATIONS`, `DURATIONS`, `STATE_UTILITIES` (each `ReadonlyArray<{ token: string; value: string; use: string }>`).

- [ ] **Step 1: Write the failing test**

Append to `tests/design-system/theme-contract.test.ts` (add `CONTROL_SIZES, DURATIONS, ELEVATIONS, RADIUS_SCALE, STATE_UTILITIES` to the `DesignTokens` import):

```ts
describe('shape, motion and states', () => {
  const utilitiesCss = readProjectFile('src/styles/utilities.css');

  for (const step of RADIUS_SCALE) {
    it(`defines ${step.token}`, () => expect(themeCss).toContain(`--${step.token}: ${step.value};`));
  }

  for (const size of CONTROL_SIZES) {
    it(`defines control size ${size.token}`, () => expect(themeCss).toContain(`--spacing-${size.token}: ${size.value};`));
  }

  it('overrides the ease-out curve', () => {
    expect(themeCss).toContain('--ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);');
  });

  for (const utility of [...ELEVATIONS, ...DURATIONS, ...STATE_UTILITIES]) {
    it(`declares @utility ${utility.token}`, () => expect(utilitiesCss).toContain(`@utility ${utility.token} {`));
  }

  it('neutralizes every tw-animate transform variable under reduced motion', () => {
    const reduced = utilitiesCss.slice(utilitiesCss.indexOf('@media (prefers-reduced-motion: reduce)'));
    for (const phase of ['enter', 'exit']) {
      for (const part of ['scale: 1', 'rotate: 0', 'translate-x: 0', 'translate-y: 0']) {
        expect(reduced).toContain(`--tw-${phase}-${part} !important;`);
      }
    }
    expect(reduced).not.toContain('--tw-enter-opacity');
  });

  it('imports utilities.css after the legacy bridge', () => {
    expect(indexCss.indexOf("@import './styles/utilities.css';")).toBeGreaterThan(indexCss.indexOf("@import './styles/legacy-tokens.css';"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run tests/design-system/theme-contract.test.ts`
Expected: FAIL — missing exports and `ENOENT … src/styles/utilities.css`.

- [ ] **Step 3: Add the constants**

Append to `src/lib/constants/DesignTokens.ts`:

```ts
export type FoundationScaleStep = Readonly<{
  token: string;
  value: string;
  use: string;
}>;

export const RADIUS_SCALE: ReadonlyArray<FoundationScaleStep> = [
  { token: 'radius-sm', value: '0.25rem', use: 'Checkbox, kbd' },
  { token: 'radius-md', value: '0.375rem', use: 'Controls' },
  { token: 'radius-lg', value: '0.625rem', use: 'Cards, popovers, dialogs, sheets' },
];

export const CONTROL_SIZES: ReadonlyArray<FoundationScaleStep> = [
  { token: 'control-sm', value: '1.75rem', use: 'size="sm" — 28px' },
  { token: 'control-md', value: '2rem', use: 'size="md" (default) — 32px' },
  { token: 'control-lg', value: '2.5rem', use: 'size="lg" — 40px' },
];

export const ELEVATIONS: ReadonlyArray<FoundationScaleStep> = [
  { token: 'shadow-raised', value: 'var(--elevation-raised)', use: 'Menus, popovers, hover cards, toasts' },
  { token: 'shadow-overlay', value: 'var(--elevation-overlay)', use: 'Dialogs, sheets' },
];

export const DURATIONS: ReadonlyArray<FoundationScaleStep> = [
  { token: 'duration-fast', value: '120ms', use: 'Hover, press' },
  { token: 'duration-base', value: '180ms', use: 'Menus, popovers, tabs' },
  { token: 'duration-slow', value: '260ms', use: 'Dialogs, sheets' },
];

export const STATE_UTILITIES: ReadonlyArray<FoundationScaleStep> = [
  { token: 'focus-ring', value: '2px solid ring + 2px offset', use: 'Buttons, links, toggles' },
  { token: 'focus-ring-input', value: 'ring border + 3px ring-subtle glow', use: 'Inputs and input-like triggers' },
  { token: 'state-invalid', value: 'danger border + danger-subtle glow', use: 'aria-invalid controls (always with a message)' },
  { token: 'state-press', value: 'scale(0.98) on :active', use: 'Pressable controls' },
];
```

- [ ] **Step 4: Extend theme.css**

In `src/styles/theme.css`, insert before the closing `}` of `@theme inline`:

```css

  /* shape + density */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.625rem;

  --spacing-control-sm: 1.75rem;
  --spacing-control-md: 2rem;
  --spacing-control-lg: 2.5rem;

  /* motion */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
```

- [ ] **Step 5: Create utilities.css and import it**

Create `src/styles/utilities.css`:

```css
/*
 * Foundation utilities — elevation, motion and the single interaction-state rule set (spec §7.4–7.6).
 * Components compose these instead of re-deriving hover/focus/press styles.
 */

/* Elevation: resting elements have no shadow; only floating layers do. */
@utility shadow-raised {
  box-shadow: var(--elevation-raised);
}

@utility shadow-overlay {
  box-shadow: var(--elevation-overlay);
}

/* Motion durations */
@utility duration-fast {
  transition-duration: var(--duration-fast);
}

@utility duration-base {
  transition-duration: var(--duration-base);
}

@utility duration-slow {
  transition-duration: var(--duration-slow);
}

/* Focus: buttons, links, toggles — solid 2px ring with offset, keyboard focus only. */
@utility focus-ring {
  outline: 2px solid transparent;
  outline-offset: 2px;

  &:focus-visible {
    outline-color: var(--ring);
  }
}

/* Focus: text inputs and input-like triggers — ring border + soft glow. */
@utility focus-ring-input {
  outline: none;

  &:focus-visible,
  &:focus-within {
    border-color: var(--ring);
    box-shadow: 0 0 0 3px var(--ring-subtle);
  }
}

/* Invalid: danger border + glow (components always pair this with a text message). */
@utility state-invalid {
  &[aria-invalid='true'] {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px var(--danger-subtle);
  }
}

/* Press feedback: subtle scale, transform-only. */
@utility state-press {
  transition-property: transform, background-color, color, border-color;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-out);

  &:active:not(:disabled, [aria-disabled='true']) {
    transform: scale(0.98);
  }
}

/* Reduced motion: keep opacity fades, remove all movement (spec §7.5). */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    --tw-enter-scale: 1 !important;
    --tw-enter-rotate: 0 !important;
    --tw-enter-translate-x: 0 !important;
    --tw-enter-translate-y: 0 !important;
    --tw-exit-scale: 1 !important;
    --tw-exit-rotate: 0 !important;
    --tw-exit-translate-x: 0 !important;
    --tw-exit-translate-y: 0 !important;
    scroll-behavior: auto !important;
  }

  .state-press:active {
    transform: none !important;
  }
}
```

In `src/index.css`, add after `@import './styles/legacy-tokens.css';`:

```css
@import './styles/utilities.css';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `P exec vp test --run tests/design-system && P exec vp build`
Expected: tests PASS; build `✓ built in`.

- [ ] **Step 7: Commit**

```bash
git add src/styles/theme.css src/styles/utilities.css src/index.css src/lib/constants/DesignTokens.ts tests/design-system/theme-contract.test.ts
git commit -m "feat(design-system): add radius, control sizes, elevation, motion and state utilities

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Forbidden-pattern ratchet

**Files:**
- Create: `tests/design-system/forbidden-patterns.ts`
- Create: `tests/design-system/forbidden-patterns.test.ts`
- Create: `scripts/design-system/update-forbidden-baseline.ts`
- Create (generated): `tests/design-system/forbidden-patterns.baseline.json`
- Modify: `package.json` (`scripts.ds:baseline`)

**Interfaces:**
- Consumes: nothing from earlier tasks (scans `src/`).
- Produces:
  - `type PatternId = 'prime-component' | 'legacy-color-ramp' | 'legacy-color-name' | 'legacy-shadow' | 'removed-button-variant' | 'hex-color' | 'raw-color-function' | 'arbitrary-length'`
  - `type PatternCounts = Partial<Record<PatternId, number>>`; `type Baseline = Record<string, PatternCounts>` (repo-relative POSIX path → counts > 0)
  - `FORBIDDEN_PATTERNS: ReadonlyArray<{ id: PatternId; regex: RegExp; why: string }>`
  - `countPatterns(source: string): PatternCounts`
  - `listSourceFiles(repoRoot: string): string[]` — repo-relative paths of `src/**/*.{tsx,mdx}` excluding `*.test.tsx`
  - `scanRepo(repoRoot: string): Baseline` (keys sorted)
  - `compareToBaseline(current: Baseline, baseline: Baseline): { regressions: string[]; improvements: string[] }`
  - Script `P ds:baseline` rewrites the baseline JSON.

- [ ] **Step 1: Write the failing test**

Create `tests/design-system/forbidden-patterns.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { compareToBaseline, countPatterns, scanRepo, type Baseline } from './forbidden-patterns';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const BASELINE_PATH = fileURLToPath(new URL('./forbidden-patterns.baseline.json', import.meta.url));

describe('countPatterns', () => {
  it('counts each banned pattern', () => {
    const source = [
      '<PrimeCard />',
      '<div className="bg-primary-15 text-muted-400 border-destructive-200" />',
      '<p className="bg-background text-foreground text-primary-foreground" />',
      '<span className="shadow-boundary shadow-deep" />',
      '<Button variant="ghost-muted-primary" />',
      "const c = '#E07B89';",
      "const d = 'rgb(0 0 0)';",
      '<i className="text-[12px] p-[1.5rem]" />',
    ].join('\n');

    expect(countPatterns(source)).toEqual({
      'prime-component': 1,
      'legacy-color-ramp': 3,
      'legacy-color-name': 3,
      'legacy-shadow': 2,
      'removed-button-variant': 1,
      'hex-color': 1,
      'raw-color-function': 1,
      'arbitrary-length': 2,
    });
  });

  it('does not count legitimate code', () => {
    const source = [
      '<div className="grid-cols-[auto_1fr] rounded-[inherit] max-w-[100dvw] bg-[var(--canvas)]" />',
      '<div className="bg-canvas text-fg border-border-strong bg-accent-subtle text-danger" />',
      '<a href="#top">Top</a>',
      '<Button variant="ghost" tone="danger" />',
      '<div className="shadow-raised shadow-overlay" />',
    ].join('\n');

    expect(countPatterns(source)).toEqual({});
  });
});

describe('compareToBaseline', () => {
  const baseline: Baseline = { 'src/a.tsx': { 'hex-color': 2 } };

  it('reports increases and new files as regressions', () => {
    const result = compareToBaseline({ 'src/a.tsx': { 'hex-color': 3 }, 'src/b.tsx': { 'prime-component': 1 } }, baseline);
    expect(result.regressions).toEqual(['src/a.tsx: hex-color 2 → 3', 'src/b.tsx: prime-component 0 → 1']);
  });

  it('reports decreases as improvements so the baseline gets lowered', () => {
    expect(compareToBaseline({}, baseline).improvements).toEqual(['src/a.tsx: hex-color 2 → 0']);
  });
});

describe('repository ratchet', () => {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
  const result = compareToBaseline(scanRepo(REPO_ROOT), baseline);

  it('introduces no new forbidden patterns', () => {
    expect(result.regressions).toEqual([]);
  });

  it('has an up-to-date baseline (after removing violations run: corepack pnpm@10.34.7 ds:baseline)', () => {
    expect(result.improvements).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: FAIL — `Failed to resolve import "./forbidden-patterns"`.

- [ ] **Step 3: Write the scanner**

Create `tests/design-system/forbidden-patterns.ts`:

```ts
/**
 * Ratchet for patterns the design system removes (spec §7.8.2).
 * Counts may only go down; the committed baseline records today's violations per file.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export type PatternId =
  | 'prime-component'
  | 'legacy-color-ramp'
  | 'legacy-color-name'
  | 'legacy-shadow'
  | 'removed-button-variant'
  | 'hex-color'
  | 'raw-color-function'
  | 'arbitrary-length';

export type PatternCounts = Partial<Record<PatternId, number>>;

export type Baseline = Record<string, PatternCounts>;

const UTILITY_PREFIX = '(?:bg|text|border|ring|fill|stroke|outline|divide|decoration|caret|placeholder|from|to|via)';

export const FORBIDDEN_PATTERNS: ReadonlyArray<{ id: PatternId; regex: RegExp; why: string }> = [
  { id: 'prime-component', regex: /\bPrime[A-Z]\w*/g, why: 'Prime* components are consolidated (spec §8.2)' },
  {
    id: 'legacy-color-ramp',
    regex: new RegExp(`\\b${UTILITY_PREFIX}-(?:primary|secondary|accent|muted|surface|success|destructive|warning)-\\d+\\b`, 'g'),
    why: 'Numeric color ramps are replaced by semantic tokens',
  },
  {
    id: 'legacy-color-name',
    regex: new RegExp(`\\b${UTILITY_PREFIX}-(?:background|foreground|primary|secondary|muted|destructive|popover)(?:-foreground)?\\b(?!-\\d)`, 'g'),
    why: 'Legacy color names live only in the legacy bridge',
  },
  { id: 'legacy-shadow', regex: /\bshadow-(?:boundary-ghost|boundary|spread|deep|inner)\b/g, why: 'Use shadow-raised / shadow-overlay' },
  {
    id: 'removed-button-variant',
    regex:
      /\bvariant=["'](?:soft-primary|soft-muted|ghost-primary|ghost-muted-primary|ghost-muted-destructive|ghost-muted|ghost-destructive|quiet-primary|surface-primary|outline-muted|outline-destructive|outline-success)["']/g,
    why: 'Replaced by variant × tone',
  },
  { id: 'hex-color', regex: /(?<![\w&#])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g, why: 'Colors come from tokens' },
  { id: 'raw-color-function', regex: /\b(?:rgba?|hsla?|oklch)\(/g, why: 'Colors come from tokens' },
  { id: 'arbitrary-length', regex: /\b[a-z][\w-]*-\[-?\d*\.?\d+(?:px|rem)\]/g, why: 'Use the Tailwind scale (README code standards)' },
];

export function countPatterns(source: string): PatternCounts {
  const counts: PatternCounts = {};

  for (const { id, regex } of FORBIDDEN_PATTERNS) {
    const matches = source.match(regex)?.length ?? 0;
    if (matches > 0) counts[id] = matches;
  }

  return counts;
}

const toPosix = (path: string) => path.split(sep).join('/');

export function listSourceFiles(repoRoot: string): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });

  return walk(join(repoRoot, 'src'))
    .filter((file) => /\.(tsx|mdx)$/.test(file) && !/\.test\.tsx$/.test(file))
    .map((file) => toPosix(relative(repoRoot, file)))
    .sort();
}

export function scanRepo(repoRoot: string): Baseline {
  const baseline: Baseline = {};

  for (const file of listSourceFiles(repoRoot)) {
    const counts = countPatterns(readFileSync(join(repoRoot, file), 'utf8'));
    if (Object.keys(counts).length > 0) baseline[file] = counts;
  }

  return baseline;
}

export function compareToBaseline(current: Baseline, baseline: Baseline): { regressions: string[]; improvements: string[] } {
  const regressions: string[] = [];
  const improvements: string[] = [];
  const files = [...new Set([...Object.keys(current), ...Object.keys(baseline)])].sort();

  for (const file of files) {
    for (const { id } of FORBIDDEN_PATTERNS) {
      const now = current[file]?.[id] ?? 0;
      const before = baseline[file]?.[id] ?? 0;
      if (now > before) regressions.push(`${file}: ${id} ${before} → ${now}`);
      if (now < before) improvements.push(`${file}: ${id} ${before} → ${now}`);
    }
  }

  return { regressions, improvements };
}
```

Create `scripts/design-system/update-forbidden-baseline.ts`:

```ts
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { scanRepo } from '../../tests/design-system/forbidden-patterns';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const baselinePath = fileURLToPath(new URL('../../tests/design-system/forbidden-patterns.baseline.json', import.meta.url));

const baseline = scanRepo(repoRoot);
const total = Object.values(baseline).reduce((sum, counts) => sum + Object.values(counts).reduce((a, b) => a + (b ?? 0), 0), 0);

writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
console.log(`Wrote ${Object.keys(baseline).length} files / ${total} violations to ${baselinePath}`);
```

Modify `package.json` `scripts` — add after `"docs:lint"`:

```json
    "ds:baseline": "tsx scripts/design-system/update-forbidden-baseline.ts"
```

- [ ] **Step 4: Generate the baseline**

Run: `P ds:baseline`
Expected: `Wrote <N> files / <M> violations to …/forbidden-patterns.baseline.json` with M > 0 (at planning time: ≥60 arbitrary-length, ≥23 hex-color, plus legacy ramps/names, 17+ files with `Prime*`).

- [ ] **Step 5: Run tests to verify they pass**

Run: `P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: PASS (6 tests).

Then prove the ratchet works: add `<div className="text-[13px]" />` to the end of any `.tsx` file's JSX temporarily, rerun → FAIL listing `arbitrary-length 1 → 2` (or `0 → 1`); revert the edit, rerun → PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/design-system/forbidden-patterns.ts tests/design-system/forbidden-patterns.test.ts tests/design-system/forbidden-patterns.baseline.json scripts/design-system/update-forbidden-baseline.ts package.json
git commit -m "test(design-system): add forbidden-pattern ratchet with committed baseline

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Foundations gallery page (+ DOM test setup)

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (dev deps)
- Create: `src/component-docs/foundations/ColorRoles.tsx`
- Create: `src/component-docs/foundations/TypeScale.tsx`
- Create: `src/component-docs/foundations/FoundationScales.tsx`
- Create: `src/component-docs/foundations/index.ts`
- Create: `src/component-docs/foundations/Foundations.mdx`
- Test: `src/component-docs/foundations/Foundations.test.tsx`
- Modify: `src/component-docs/gallery/utils.tsx` (`buildCategoryTabOptions`)
- Test: `src/component-docs/gallery/utils.test.ts`

**Interfaces:**
- Consumes: `SEMANTIC_COLOR_ROLES`, `TEXT_SCALE`, `RADIUS_SCALE`, `CONTROL_SIZES`, `ELEVATIONS`, `DURATIONS`, `STATE_UTILITIES` from `@constants`; utilities from Tasks 3–5.
- Produces: default-export components `ColorRoles`, `TypeScale`, `FoundationScales` (re-exported by name from `@component-docs/foundations`); a gallery doc with id `foundations`, category `Foundations`; the `FOUNDATIONS` tab ordered first.

- [ ] **Step 1: Install the DOM test dependencies**

Run: `P add -D happy-dom@^21.0.1 @testing-library/react@^16.3.3 @testing-library/dom@^10.4.2`
Expected: `Done`; three new `devDependencies` in `package.json`.

- [ ] **Step 2: Write the failing tests**

Create `src/component-docs/foundations/Foundations.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SEMANTIC_COLOR_ROLES, TEXT_SCALE } from '@constants';

import { ColorRoles, FoundationScales, TypeScale } from '@component-docs/foundations';

afterEach(cleanup);

describe('ColorRoles', () => {
  it('renders a light and a dark panel', () => {
    const { container } = render(<ColorRoles />);
    const panels = container.querySelectorAll('[data-slot="color-roles-panel"]');
    expect([...panels].map((panel) => panel.classList.contains('light') || panel.classList.contains('dark'))).toEqual([true, true]);
  });

  it('renders one swatch per role in each mode', () => {
    const { container } = render(<ColorRoles />);
    expect(container.querySelectorAll('[data-slot="color-role-swatch"]')).toHaveLength(SEMANTIC_COLOR_ROLES.length * 2);
  });
});

describe('TypeScale', () => {
  it('renders an English and an Arabic sample per step', () => {
    const { container } = render(<TypeScale />);
    expect(container.querySelectorAll('[data-slot="type-scale-row"]')).toHaveLength(TEXT_SCALE.length);
    expect(container.querySelectorAll('[dir="rtl"]')).toHaveLength(TEXT_SCALE.length);
  });
});

describe('FoundationScales', () => {
  it('renders the radius, size, elevation, motion and state sections', () => {
    const { container } = render(<FoundationScales />);
    const sections = [...container.querySelectorAll('[data-slot="foundation-scale-section"]')].map((section) => section.getAttribute('data-section'));
    expect(sections).toEqual(['radius', 'control-size', 'elevation', 'motion', 'states']);
  });
});
```

Create `src/component-docs/gallery/utils.test.ts`:

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vite-plus/test';

import { buildCategoryTabOptions } from './utils';

import type { ComponentDocEntry } from '@component-docs/registry';

const doc = (category: string): ComponentDocEntry => ({
  id: category.toLowerCase(),
  title: category,
  section: 'Components',
  category,
  description: category,
  load: async () => ({ default: () => null }),
});

describe('buildCategoryTabOptions', () => {
  it('orders Foundations first, then UI, with Calendar last', () => {
    const tabs = buildCategoryTabOptions(['Shared', 'Calendar', 'UI', 'Forms', 'Foundations'].map(doc));
    expect(tabs.map((tab) => tab.key)).toEqual(['FOUNDATIONS', 'UI', 'FORMS', 'SHARED', 'CALENDAR']);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `P exec vp test --run src/component-docs`
Expected: FAIL — `Failed to resolve import "@component-docs/foundations"` and the ordering test receives `['UI', 'FORMS', 'FOUNDATIONS', 'SHARED', 'CALENDAR']`.

- [ ] **Step 4: Implement the showcase components**

Create `src/component-docs/foundations/ColorRoles.tsx`:

```tsx
import { cn } from '@utils';

import { SEMANTIC_COLOR_ROLES } from '@constants';

const MODES = ['light', 'dark'] as const;

const ColorRoles = () => (
  <div data-slot="color-roles" className="grid gap-4 md:grid-cols-2">
    {MODES.map((mode) => (
      <section key={mode} data-slot="color-roles-panel" className={cn(mode, 'bg-canvas text-fg border-border rounded-lg border p-4')}>
        <h3 className="text-fg-muted mb-3 text-xs font-medium capitalize">{mode}</h3>

        <ul className="grid gap-2">
          {SEMANTIC_COLOR_ROLES.map((role) => (
            <li key={role.token} className="flex items-center gap-3">
              <span
                data-slot="color-role-swatch"
                className="border-border size-8 shrink-0 rounded-md border"
                style={{ background: `var(--${role.token})` }}
              />

              <span className="min-w-0">
                <code className="block font-mono text-xs">{role.token}</code>

                <span className="text-fg-muted block text-xs">{role.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default ColorRoles;
```

Create `src/component-docs/foundations/TypeScale.tsx`:

```tsx
import { TEXT_SCALE } from '@constants';

const TypeScale = () => (
  <div data-slot="type-scale" className="divide-border-subtle divide-y">
    {TEXT_SCALE.map((step) => (
      <div key={step.token} data-slot="type-scale-row" className="grid gap-2 py-3 md:grid-cols-[10rem_1fr_1fr] md:items-baseline">
        <span className="text-fg-muted font-mono text-xs">
          {step.token} · {step.px}px
        </span>

        <span className={step.token}>Patient records — 2981-4410-22</span>

        <span dir="rtl" className={step.token}>
          سجلات المرضى — 2981-4410-22
        </span>
      </div>
    ))}
  </div>
);

export default TypeScale;
```

Create `src/component-docs/foundations/FoundationScales.tsx`:

```tsx
import type { ReactNode } from 'react';

import { cn } from '@utils';

import { CONTROL_SIZES, DURATIONS, ELEVATIONS, RADIUS_SCALE, STATE_UTILITIES } from '@constants';

type ScaleSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

const ScaleSection = ({ id, title, children }: ScaleSectionProps) => (
  <section data-slot="foundation-scale-section" data-section={id} className="grid gap-3">
    <h3 className="text-md font-semibold">{title}</h3>

    {children}
  </section>
);

const RADIUS_CLASS: Record<string, string> = { 'radius-sm': 'rounded-sm', 'radius-md': 'rounded-md', 'radius-lg': 'rounded-lg' };

const HEIGHT_CLASS: Record<string, string> = { 'control-sm': 'h-control-sm', 'control-md': 'h-control-md', 'control-lg': 'h-control-lg' };

const FoundationScales = () => (
  <div data-slot="foundation-scales" className="grid gap-8">
    <ScaleSection id="radius" title="Radius">
      <div className="flex flex-wrap gap-4">
        {RADIUS_SCALE.map((step) => (
          <figure key={step.token} className="grid gap-1">
            <span className={cn(RADIUS_CLASS[step.token], 'bg-surface border-border-strong size-16 border')} />

            <figcaption className="text-fg-muted font-mono text-xs">{step.token}</figcaption>
          </figure>
        ))}
      </div>
    </ScaleSection>

    <ScaleSection id="control-size" title="Control sizes">
      <div className="flex flex-wrap items-end gap-3">
        {CONTROL_SIZES.map((size) => (
          <span key={size.token} className={cn(HEIGHT_CLASS[size.token], 'bg-inverse text-inverse-fg inline-flex items-center rounded-md px-3 text-sm')}>
            {size.use}
          </span>
        ))}
      </div>
    </ScaleSection>

    <ScaleSection id="elevation" title="Elevation">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-surface border-border rounded-lg border p-4 text-sm">Resting — border only</div>

        {ELEVATIONS.map((elevation) => (
          <div key={elevation.token} className={cn(elevation.token, 'bg-surface-raised rounded-lg p-4 text-sm')}>
            {elevation.use}
          </div>
        ))}
      </div>
    </ScaleSection>

    <ScaleSection id="motion" title="Motion">
      <ul className="grid gap-1 text-sm">
        {DURATIONS.map((duration) => (
          <li key={duration.token}>
            <code className="font-mono text-xs">{duration.token}</code> · {duration.value} · <span className="text-fg-muted">{duration.use}</span>
          </li>
        ))}
      </ul>
    </ScaleSection>

    <ScaleSection id="states" title="Interaction states">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="focus-ring state-press bg-inverse text-inverse-fg hover:bg-pressed h-control-md rounded-md px-3 text-sm">
          Press or tab to me
        </button>

        <input aria-label="Focus demo" placeholder="Focus me" className="focus-ring-input border-border-strong bg-surface placeholder:text-fg-muted h-control-md rounded-md border px-3 text-sm" />

        <input aria-label="Invalid demo" aria-invalid="true" defaultValue="2981-44" className="state-invalid border-border-strong bg-surface h-control-md rounded-md border px-3 text-sm" />

        <span className="text-danger text-xs">ID must be 10 digits</span>
      </div>

      <ul className="text-fg-muted grid gap-1 text-xs">
        {STATE_UTILITIES.map((utility) => (
          <li key={utility.token}>
            <code className="text-fg font-mono">{utility.token}</code> — {utility.value} · {utility.use}
          </li>
        ))}
      </ul>
    </ScaleSection>
  </div>
);

export default FoundationScales;
```

> Tailwind detects classes from source text; dynamic class names come only from the literal maps/constants above (`RADIUS_CLASS`, `HEIGHT_CLASS`, `TEXT_SCALE` tokens, `ELEVATIONS` tokens), all of which appear verbatim in source files, so they are generated.

Create `src/component-docs/foundations/index.ts`:

```ts
export { default as ColorRoles } from './ColorRoles';
export { default as FoundationScales } from './FoundationScales';
export { default as TypeScale } from './TypeScale';
```

- [ ] **Step 5: Order the Foundations tab first**

In `src/component-docs/gallery/utils.tsx`, inside `buildCategoryTabOptions`, insert directly before `return categoryTabs;`:

```ts
  const foundationsTabIndex = categoryTabs.findIndex((categoryTab) => categoryTab.key === 'FOUNDATIONS');
  if (foundationsTabIndex > 0) {
    const [foundations] = categoryTabs.splice(foundationsTabIndex, 1);
    categoryTabs.unshift(foundations);
  }
```

- [ ] **Step 6: Write the MDX page**

Create `src/component-docs/foundations/Foundations.mdx`:

```mdx
---
id: foundations
title: Foundations
section: Foundations
category: Foundations
description: 'Graphite Instrument tokens: color roles, typography, shape, elevation, motion and interaction states.'
tags: [foundations, tokens, color, typography, theme]
---

import { ColorRoles, FoundationScales, TypeScale } from '@component-docs/foundations';

## Color roles

Components use **only** these semantic tokens (`bg-canvas`, `text-fg-muted`, `border-border-strong`, …). Each role is tuned per mode and contrast-tested (text ≥ 4.5:1, controls and focus ≥ 3:1). Oxblood is the single accent; errors use vermilion so they never read as the brand.

<ColorRoles />

## Typography

Schibsted Grotesk for UI, Noto Kufi Arabic for Arabic (per-glyph fallback, so digits stay Western and consistent), Spline Sans Mono for IDs, amounts and shortcuts. Body text is `text-base` (14px). Arabic gets extra line height automatically under `dir="rtl"`.

<TypeScale />

## Shape, elevation, motion and states

Resting surfaces use borders, never shadows; only floating layers are elevated. Motion animates `transform` and `opacity` only, and drops movement under `prefers-reduced-motion`.

<FoundationScales />
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `P exec vp test --run src/component-docs && P docs:lint && P exec tsc -b`
Expected: tests PASS (5); `Component docs lint passed`; tsc exit 0.

Run: `P exec vp test --run tests/design-system/forbidden-patterns.test.ts`
Expected: PASS — the new files introduce no forbidden patterns (no hex, no arbitrary lengths).

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml src/component-docs/foundations src/component-docs/gallery/utils.tsx src/component-docs/gallery/utils.test.ts
git commit -m "docs(design-system): add Foundations gallery page and DOM test setup

Adds happy-dom + @testing-library/react (and its required @testing-library/dom
peer) for component tests; Foundations tab is listed first in the gallery.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Design lens, documentation and full verification

**Files:**
- Create (installed): `.claude/skills/redesign-skill/`, `.claude/skills/output-skill/` (plus `skills-lock.json` if the CLI writes one)
- Modify: `.impeccable.md` (full rewrite)
- Modify: `README.md` (Code Standards "Styling" line and "Theming" note)

**Interfaces:**
- Consumes: everything above.
- Produces: the project-local Taste skills used by sub-projects 2–4; updated design context docs.

- [ ] **Step 1: Install the Taste skills (project-local, copied so they are committed)**

Run:

```bash
npx -y skills add Leonxlnx/taste-skill --skill redesign-skill --agent claude-code --copy -y
npx -y skills add Leonxlnx/taste-skill --skill output-skill --agent claude-code --copy -y
ls .claude/skills/redesign-skill/SKILL.md .claude/skills/output-skill/SKILL.md
```

Expected: both `SKILL.md` paths listed. If the CLI rejects `--agent claude-code`, its error lists the valid agent ids — rerun with the Claude Code id. Read both `SKILL.md` files fully before committing them (they become instructions for future work).

- [ ] **Step 2: Rewrite `.impeccable.md`**

Replace the file with:

```markdown
# Design Context — RSK (React Starter Kit)

## Target audience

Frontend developers and teams evaluating or cloning RSK, a production-grade React + TypeScript + Vite+ starter for data-heavy admin products (clinical records is the reference domain). Technical, design-aware, value DX and consistency.

## Brand personality / tone

**Graphite Instrument** — precise, dense, calm, confident. A tool used all day, not a marketing page. Newsroom precision rather than playful or corporate-bland.

## Visual system (spec: docs/superpowers/specs/2026-10-15-ui-kit-design-system-design.md)

- **Color:** dark-first graphite neutrals with a hand-tuned light mode; one accent, **Oxblood** (links, selection, focus); primary actions are neutral (`inverse`). Errors are **vermilion**, info is **steel**. Semantic tokens only — see the Foundations page in the component gallery.
- **Typography:** **Schibsted Grotesk** (UI) + **Noto Kufi Arabic** (RTL) + **Spline Sans Mono** (IDs, amounts, shortcuts). 14px body; Western digits in both locales.
- **Shape:** radius 4 / 6 / 10; control heights 28 / 32 / 40.
- **Depth:** resting surfaces use borders, never shadows; only menus/popovers/dialogs float.
- **Motion:** 120 / 180 / 260ms, one ease-out curve, transform + opacity only, reduced-motion safe.
- **Avoid (AI slop):** blue/indigo/violet/teal/mint accents, cream + terracotta, purple gradients, glassmorphism, gradient text, neon on dark, identical card grids, soft 16px+ radii on controls, shadows on resting cards.
```

- [ ] **Step 3: Update the README**

In `README.md`:
- Replace the sentence `**Styling** — Theme-aware tokens only (\`bg-background\`, not \`bg-white\`).` with `**Styling** — Semantic tokens only (\`bg-canvas\`, \`text-fg-muted\`, \`border-border-strong\` — see the Foundations page in the gallery); never raw colors.`
- Replace the "Theming" note text `When adding new design tokens, define them in both \`:root\` (light) and \`.dark\` (dark) blocks in \`index.css\`.` with `Semantic tokens live in \`src/styles/tokens.css\` (light on \`:root, .light\`, dark on \`.dark\`) and are exposed to Tailwind in \`src/styles/theme.css\`; \`pnpm test\` enforces WCAG contrast for every pair.`

Run: `grep -n "bg-background\|index.css" README.md` — Expected: no remaining instruction to add tokens in `index.css`.

- [ ] **Step 4: Full verification**

Run each and record the result:

```bash
P exec vp check          # Expected: "Found 0 errors"
P exec vp test --run     # Expected: all test files pass
P exec tsc -b && P exec tsc -p tsconfig.scripts.json   # Expected: exit 0
P exec vp build          # Expected: "✓ built in"
P docs:lint              # Expected: "Component docs lint passed"
```

If `vp check` reports formatting issues only in files this plan created, run `P exec vp fmt <those files>` and re-run.

- [ ] **Step 5: Four-way visual verification**

Start `P exec vp dev --open false --port 3123` in the background. Using the playwright-cli skill, for each combination of theme (`localStorage['vite-ui-theme']` = `dark` | `light`) and language (`localStorage['i18nextLng']` = `en` | `ar`), reload and screenshot:
- `http://localhost:3123/components/foundations`
- `http://localhost:3123/components`
- `http://localhost:3123/dashboard`

Save to `.superpowers/screens/foundations-<theme>-<lang>-<page>.png` (gitignored). Review against the spec: graphite surfaces, Oxblood only on links/selection/focus/legacy primary, no solid-Oxblood menu highlights, Arabic in Noto Kufi with visibly taller lines, Western digits in both locales, light panel on the Foundations page renders light inside the dark app. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills .impeccable.md README.md
git add -f skills-lock.json 2>/dev/null || true
git commit -m "chore(design-system): install Taste design-lens skills and document Graphite Instrument

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
