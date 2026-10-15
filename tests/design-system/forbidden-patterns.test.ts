import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { compareToBaseline, countPatterns, nextBaseline, scanRepo, type Baseline } from './forbidden-patterns';

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
  readdirSync(dir, { withFileTypes: true })
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
