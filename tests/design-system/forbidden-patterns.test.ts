import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { compareToBaseline, countPatterns, listSourceFiles, nextBaseline, scanRepo, type Baseline } from './forbidden-patterns';

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

  it('counts side-border and ring-offset legacy names, and palette colours the theme does not define', () => {
    const source = [
      '<div className="border-s-destructive ring-offset-background focus-visible:ring-primary/40" />',
      '<Star className="text-yellow-500 fill-yellow-500" />',
      '<p className="text-green-600 bg-red-50" />',
    ].join('\n');

    expect(countPatterns(source)).toEqual({ 'legacy-color-name': 3, 'palette-color': 4 });
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

describe('countPatterns — Ledger', () => {
  it('counts the marks Ledger retires: state fills, soft radii, typed section numbers', () => {
    const source = [
      '<a className="data-[state=active]:bg-surface aria-selected:bg-hover aria-[current=page]:bg-hover" />',
      '<b className="group-data-[variant=contained]/tabs-list:data-[state=active]:bg-surface data-[active=true]:bg-fg" />',
      '<i className="rounded-xl rounded-2xl" />',
      '<h2>01</h2><h3>§</h3>',
    ].join('\n');

    expect(countPatterns(source)).toEqual({ 'state-fill': 5, 'large-control-radius': 2, 'typed-section-number': 2 });
  });

  it('does not count the Ledger marks or keyboard highlight', () => {
    const source = [
      '<a className="data-[state=active]:ink-block data-highlighted:bg-hover data-[selected=true]:bg-hover focus:bg-hover" />',
      '<i className="rounded-sm rounded-md rounded-lg rounded-full" />',
      '<h2>{SECTION_SIGN} 2026</h2>',
    ].join('\n');

    expect(countPatterns(source)).toEqual({});
  });
});

describe('countPatterns — motion', () => {
  it('counts off-scale durations and easings', () => {
    const source = [
      '<a className="duration-150 duration-200 duration-[350ms] ease-linear ease-in-out" />',
      "const fade = 'transition-opacity duration-300';",
    ].join('\n');

    expect(countPatterns(source)).toEqual({ 'raw-motion': 6 });
  });

  it('counts any numeric duration or delay, and arbitrary easings and animations', () => {
    const source = '<a className="duration-250 duration-0 delay-150 ease-[cubic-bezier(0,0,1,1)] animate-[spin_1s_linear]" />';

    expect(countPatterns(source)).toEqual({ 'raw-motion': 5 });
  });

  it('allows the motion tokens', () => {
    const source =
      '<a className="duration-instant duration-fast duration-base duration-exit duration-slow duration-spring duration-spring-long duration-roll ease-out ease-in ease-spring" />';

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

describe('nextBaseline', () => {
  const committed: Baseline = { 'src/a.tsx': { 'hex-color': 2, 'prime-component': 1 } };

  it('lowers counts when violations are removed', () => {
    expect(nextBaseline({ 'src/a.tsx': { 'hex-color': 1 } }, committed, { allowIncrease: false })).toEqual({
      baseline: { 'src/a.tsx': { 'hex-color': 1 } },
      regressions: [],
    });
  });

  it('refuses to launder a regression into the baseline', () => {
    const result = nextBaseline({ 'src/a.tsx': { 'hex-color': 1 }, 'src/b.tsx': { 'arbitrary-length': 1 } }, committed, {
      allowIncrease: false,
    });
    expect(result.baseline).toBeNull();
    expect(result.regressions).toEqual(['src/b.tsx: arbitrary-length 0 → 1']);
  });

  it('accepts increases only when explicitly allowed', () => {
    const current: Baseline = { 'src/b.tsx': { 'arbitrary-length': 1 } };
    expect(nextBaseline(current, committed, { allowIncrease: true }).baseline).toEqual(current);
  });
});

/** Plan A (SP2 batches 0–3) primitives must stay free of every forbidden pattern. */
describe('clean primitives', () => {
  it('calendar views (user direction, Plan B) contain no forbidden patterns', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/calendar/'));
    expect(offenders).toEqual([]);
  });

  it('forms/ contains no forbidden patterns (SP3 Plan A)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/forms/'));
    expect(offenders).toEqual([]);
  });

  it('table filters contain no forbidden patterns (SP3 Plan A)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/tables/data-table-filters/'));
    expect(offenders).toEqual([]);
  });

  it('Plan A shared folders contain no forbidden patterns', () => {
    const folders = ['src/components/shared/confirm-dialog/', 'src/components/shared/count-tooltip/', 'src/components/ui/'];
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => folders.some((folder) => file.startsWith(folder)));
    expect(offenders).toEqual([]);
  });

  it('Plan A retired components are gone', () => {
    const retired = [
      'form-control',
      'form-label',
      'form-message',
      'error-tooltip',
      'form-submit-buttons',
      'field-section',
      'prime-card',
      'collapsible-card',
    ];
    const present = componentFolders(`${REPO_ROOT}src/components`).filter((name) => retired.includes(name));
    expect(present).toEqual([]);
  });

  it('Plan B app code contains no forbidden patterns', () => {
    const scopes = [
      'src/components/shared/',
      'src/components/tables/',
      'src/components/calendar/',
      'src/layouts/',
      'src/routes/',
      'src/App.tsx',
      'src/pages/clinic/',
      'src/pages/members/',
    ];
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => scopes.some((scope) => file.startsWith(scope)));
    expect(offenders).toEqual([]);
  });

  it('Plan B retired components are gone', () => {
    const retired = ['prime-loader', 'blank-slate', 'action-panel', 'meta-card', 'grid-card', 'layout'];
    const present = componentFolders(`${REPO_ROOT}src/components`).filter((name) => retired.includes(name));
    expect(present).toEqual([]);
    const retiredLayouts = [
      'dashboard-layout',
      'dashboard-sidebar',
      'dashboard-sidebar-drawer',
      'dashboard-sidebar-link',
      'dashboard-header',
    ];
    const presentLayouts = componentFolders(`${REPO_ROOT}src/layouts`).filter((name) => retiredLayouts.includes(name));
    expect(presentLayouts).toEqual([]);
  });

  it('component docs contain no forbidden patterns (SP3 Plan C)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/component-docs/'));
    expect(offenders).toEqual([]);
  });

  it('pages contain no forbidden patterns (SP3 Plan C)', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/pages/') || file.startsWith('src/views/'));
    expect(offenders).toEqual([]);
  });
});

/** Folders SP2 replaced (addendum §1, §8, §10). None may come back under src/components. */
const DELETED_COMPONENT_FOLDERS = [
  'prime-dialog',
  'prime-tooltip',
  'prime-dropdown',
  'scroll-selector',
  'chip',
  'radio-dot',
  'loading-button',
  'link-button',
  'tooltip-button',
] as const;

const componentFolders = (dir: string): string[] =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => [entry.name, ...componentFolders(`${dir}/${entry.name}`)]);

describe('SP2 exit', () => {
  it('src/components/ui contains no forbidden patterns', () => {
    const offenders = Object.keys(scanRepo(REPO_ROOT)).filter((file) => file.startsWith('src/components/ui/'));
    expect(offenders).toEqual([]);
  });

  it('the baseline records nothing under src/components/ui', () => {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
    expect(Object.keys(baseline).filter((file) => file.startsWith('src/components/ui/'))).toEqual([]);
  });

  it('the replaced component folders are gone', () => {
    const present = componentFolders(`${REPO_ROOT}src/components`).filter((name) =>
      (DELETED_COMPONENT_FOLDERS as readonly string[]).includes(name),
    );
    expect(present).toEqual([]);
  });
});

describe('scan scope', () => {
  it('scans .ts sources as well as .tsx and .mdx, but not tests', () => {
    const files = listSourceFiles(REPO_ROOT);
    expect(files).toContain('src/lib/utils/tailwind.ts');
    expect(files.some((file) => /\.test\.tsx?$/.test(file))).toBe(false);
  });
});

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
