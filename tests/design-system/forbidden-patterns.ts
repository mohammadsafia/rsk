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
    regex: new RegExp(
      `\\b${UTILITY_PREFIX}-(?:background|foreground|primary|secondary|muted|destructive|popover)(?:-foreground)?\\b(?!-\\d)`,
      'g',
    ),
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
