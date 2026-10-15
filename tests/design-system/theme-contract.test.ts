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
  STATE_UTILITIES,
  TEXT_SCALE,
} from '../../src/lib/constants/DesignTokens';
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
    const legacyAccent =
      /\b(?:bg|text|border|ring)-accent-(?:foreground|200|300|400)\b|(?:focus|hover|data-\[(?!slot=)[^\]]+\]):bg-accent(?![-\w])/;
    const offenders = listFiles(SRC_DIR)
      .filter((file) => /\.(tsx|ts|mdx)$/.test(file))
      .filter((file) => legacyAccent.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(SRC_DIR, 'src/'));
    expect(offenders).toEqual([]);
  });
});

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
    expect(indexCss.indexOf("@import './styles/utilities.css';")).toBeGreaterThan(
      indexCss.indexOf("@import './styles/legacy-tokens.css';"),
    );
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
