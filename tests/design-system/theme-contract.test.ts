import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  CONTROL_SIZES,
  DURATIONS,
  ELEVATIONS,
  FONT_FAMILIES,
  RADIUS_SCALE,
  SEMANTIC_COLOR_ROLES,
  SIGNATURE_MARKS,
  STATE_UTILITIES,
  TEXT_SCALE,
} from '../../src/lib/constants/DesignTokens';
import { extractBlock, readProjectFile } from './css-tokens';
import { checkFontLoading } from './target-checks';

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
  it('imports palette → tokens → theme', () => {
    const order = ['./styles/palette.css', './styles/tokens.css', './styles/theme.css'].map((file) =>
      indexCss.indexOf(`@import '${file}';`),
    );
    order.forEach((position) => expect(position).toBeGreaterThan(-1));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe('legacy accent migration', () => {
  it('leaves no usage of the old soft-hover accent utilities in src/', () => {
    // The soft-hover meaning of `accent` is gone (SP1); state-scoped `bg-accent` is now the legitimate Oxblood selection.
    const legacyAccent = /\b(?:bg|text|border|ring)-accent-(?:foreground|200|300|400)\b/;
    const offenders = listFiles(SRC_DIR)
      .filter((file) => /\.(tsx|ts|mdx)$/.test(file))
      .filter((file) => legacyAccent.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(SRC_DIR, 'src/'));
    expect(offenders).toEqual([]);
  });
});

describe('typography', () => {
  it('loads exactly the three approved families (Vite: Google Fonts in index.css; Next: next/font in the root layout)', () => {
    expect(checkFontLoading(fileURLToPath(new URL('../../', import.meta.url)))).toEqual([]);
  });

  it('exposes the sans and mono stacks', () => {
    // A Next app sets --font-brand-* from next/font; a Vite app leaves them unset and gets the named families.
    expect(FONT_FAMILIES.sans).toBe(
      "var(--font-brand-sans, 'Schibsted Grotesk'), var(--font-brand-arabic, 'Noto Kufi Arabic'), system-ui, sans-serif",
    );
    expect(FONT_FAMILIES.mono).toBe("var(--font-brand-mono, 'Spline Sans Mono'), ui-monospace, 'SFMono-Regular', monospace");
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
    const bodyApply = /body \{\s*@apply ([^;]+);/.exec(indexCss)?.[1].split(/\s+/) ?? [];
    expect(bodyApply).toEqual(expect.arrayContaining(['bg-canvas', 'text-fg', 'font-sans']));
    expect(bodyApply).not.toContain('font-family-sans');
  });
});

describe('shape, motion and states', () => {
  const utilitiesCss = readProjectFile('src/styles/utilities.css');

  for (const step of RADIUS_SCALE) {
    it(`defines ${step.token}`, () => expect(themeCss).toContain(`--${step.token}: ${step.value};`));
  }

  it('defines the Ledger mark widths on :root', () => {
    expect(extractBlock(tokensCss, ':root')).toMatchObject({
      'ink-thickness': '2px',
      'ink-offset': '4px',
      'rule-width': '2px',
      'rule-width-section': '3px',
    });
  });

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
    // The global block (utilities may nest their own reduced-motion rules above it).
    const reduced = utilitiesCss.slice(utilitiesCss.indexOf('/* Reduced motion: keep opacity fades'));
    for (const phase of ['enter', 'exit']) {
      for (const part of ['scale: 1', 'rotate: 0', 'translate-x: 0', 'translate-y: 0']) {
        expect(reduced).toContain(`--tw-${phase}-${part} !important;`);
      }
    }
    expect(reduced).not.toContain('--tw-enter-opacity');
  });

  it('imports utilities.css after the theme', () => {
    expect(indexCss.indexOf("@import './styles/utilities.css';")).toBeGreaterThan(indexCss.indexOf("@import './styles/theme.css';"));
  });
});

describe('retired meanings', () => {
  it('uses no text-surface: "surface" no longer means always-white, it is the card background', () => {
    const offenders = listFiles(SRC_DIR)
      .filter((file) => /\.(tsx|mdx)$/.test(file))
      .filter((file) => /(?:^|[\s:'"`])text-surface(?![-\w])/.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(SRC_DIR, 'src/'));
    expect(offenders).toEqual([]);
  });
});

describe('utility behavior', () => {
  const utilitiesCss = readProjectFile('src/styles/utilities.css');
  const utilityBody = (name: string) => {
    const start = utilitiesCss.indexOf(`@utility ${name} {`);
    return utilitiesCss.slice(start, utilitiesCss.indexOf('\n}', start));
  };

  for (const speed of ['fast', 'base', 'slow']) {
    it(`duration-${speed} also drives tw-animate enter/exit animations`, () => {
      expect(utilityBody(`duration-${speed}`)).toContain(`--tw-duration: var(--duration-${speed});`);
    });
  }

  it('focus-ring-input keeps a transparent outline so focus survives forced-colors mode', () => {
    const body = utilityBody('focus-ring-input');
    expect(body).toContain('outline: 2px solid transparent;');
    expect(body).not.toContain('outline: none');
  });
});

describe('Ledger signature marks', () => {
  const utilitiesCss = readProjectFile('src/styles/utilities.css');
  /** The body of one @utility block (up to the next @utility or the end). */
  const utilityBlock = (name: string) => {
    const start = utilitiesCss.indexOf(`@utility ${name} {`);
    const next = utilitiesCss.indexOf('@utility ', start + 1);
    return utilitiesCss.slice(start, next < 0 ? undefined : next);
  };

  for (const mark of SIGNATURE_MARKS) {
    it(`declares @utility ${mark.token}`, () => expect(utilitiesCss).toContain(`@utility ${mark.token} {`));
  }

  it('draws in only when reduced motion is not requested', () => {
    const blocks = utilitiesCss.split('@utility ').filter((block) => block.includes('animation: rsk-draw-in'));
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const gate = block.indexOf('@media (prefers-reduced-motion: no-preference)');
      expect(gate).toBeGreaterThan(-1);
      expect(gate).toBeLessThan(block.indexOf('animation: rsk-draw-in'));
    }
    expect(utilitiesCss).toContain('@keyframes rsk-draw-in');
  });

  it('mirrors the draw-in under dir=rtl', () => {
    for (const name of ['ink-block', 'rule-top']) {
      expect(utilityBlock(name)).toContain('transform-origin: left;');
      expect(utilityBlock(name)).toMatch(/\[dir='rtl'\][^{]*\{\s*transform-origin: right;/);
    }
  });

  it('keeps the ink and the rule visible in forced-colors mode', () => {
    for (const name of ['ink-block', 'rule-top']) expect(utilityBlock(name)).toContain('@media (forced-colors: active)');
  });

  it('focuses text fields with an fg border and the ink underline', () => {
    const block = utilityBlock('focus-ring-input');
    expect(block).toContain('border-color: var(--fg);');
    expect(block).toContain('box-shadow: 0 var(--ink-thickness) 0 0 var(--ink);');
    expect(block).not.toContain('ring-subtle');
  });

  it('keeps state-invalid after focus-ring-input so invalid wins on focus', () => {
    expect(utilitiesCss.indexOf('@utility state-invalid {')).toBeGreaterThan(utilitiesCss.indexOf('@utility focus-ring-input {'));
  });

  it('keeps the ink bar inside its host, so overflow-clipped strips (tabs) still show 2px', () => {
    expect(utilityBlock('ink-block')).toContain('bottom: 0;');
    expect(utilityBlock('ink-block')).not.toContain('bottom: -1px;');
  });

  it('wins the top edge over border, rounded-* and border-t on its host', () => {
    const block = utilityBlock('rule-top');
    for (const declaration of [
      'border-top-width: 0 !important;',
      'border-start-start-radius: 0 !important;',
      'border-start-end-radius: 0 !important;',
    ]) {
      expect(block).toContain(declaration);
    }
  });

  it('numbers sections with Western leading-zero counters', () => {
    expect(utilityBlock('sections')).toContain('counter-reset: rsk-section;');
    expect(utilityBlock('section-number')).toContain('counter-increment: rsk-section;');
    expect(utilityBlock('section-number')).toContain('content: counter(rsk-section, decimal-leading-zero);');
  });
});

describe('browser-painted UI follows the theme', () => {
  const utilitiesCss = readProjectFile('src/styles/utilities.css');
  /** The raw body of the first `selector {` block (declarations, not just custom properties). */
  const rawBlock = (css: string, selector: string) => {
    const open = css.indexOf('{', css.indexOf(`${selector} {`));
    return css.slice(open + 1, css.indexOf('}', open));
  };

  it('declares color-scheme per theme, so autofill, scrollbars and pickers match', () => {
    expect(rawBlock(tokensCss, '.light')).toContain('color-scheme: light;');
    expect(rawBlock(tokensCss, '.dark')).toContain('color-scheme: dark;');
  });

  it('repaints autofilled fields with the theme surface and text', () => {
    const rule = utilitiesCss.slice(utilitiesCss.indexOf(':is(input, textarea, select):is(:autofill, :-webkit-autofill) {'));
    expect(rule.length).toBeGreaterThan(0);
    expect(rule).toContain('-webkit-text-fill-color: var(--fg);');
    expect(rule).toContain('box-shadow: 0 0 0 100vmax var(--surface) inset;');
  });

  it('keeps the focus underline and the invalid glow on autofilled fields', () => {
    expect(utilitiesCss).toContain(
      ':is(input, textarea, select):is(:autofill, :-webkit-autofill):focus-visible {\n  box-shadow:\n    0 0 0 100vmax var(--surface) inset,\n    0 var(--ink-thickness) 0 0 var(--ink);',
    );
    expect(utilitiesCss).toContain(":is(input, textarea, select):is(:autofill, :-webkit-autofill)[aria-invalid='true']");
  });
});
