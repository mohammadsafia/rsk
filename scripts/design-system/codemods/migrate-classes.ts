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
  primary: {
    15: 'accent-subtle',
    25: 'accent-subtle',
    50: 'accent-subtle',
    100: 'accent-subtle',
    200: 'accent-subtle',
    300: 'accent',
    400: 'accent',
    600: 'accent',
    700: 'accent',
    800: 'accent',
    900: 'accent',
  },
  secondary: {
    15: 'surface-sunken',
    25: 'surface-sunken',
    50: 'surface-sunken',
    100: 'surface-sunken',
    200: 'border',
    300: 'border',
    400: 'border-strong',
    600: 'fg-muted',
    700: 'fg-muted',
    800: 'fg',
    900: 'fg',
  },
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
};

const COLOUR = new RegExp(
  `(?<![\\w-])(${PREFIX})-(background|foreground|primary|secondary|popover|muted|destructive|success|warning)(?:-(foreground|\\d+))?(?![\\w-])`,
  'g',
);
const SHADOWS = /(?<![\w-])shadow-(?:boundary-ghost|boundary|spread|deep)(?![\w-])/g;
/** shadow-inner has no replacement: drop it with one neighbouring space. */
const INNER_SHADOW = / ?(?<![\w-])shadow-inner(?![\w-])/g;

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
    .replace(INNER_SHADOW, () => {
      changes += 1;
      return '';
    })
    .replace(SHADOWS, (match) => {
      changes += 1;
      return SHADOW[match];
    });

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
