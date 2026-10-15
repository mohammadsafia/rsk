import type { AttrValue, TagRule } from './migrate-props';

/** Old Button variant → new { variant, tone } (addendum §5). Omitted keys mean the defaults (solid / neutral). */
export const BUTTON_VARIANTS: Readonly<Record<string, { variant?: 'outline' | 'ghost' | 'link'; tone?: 'accent' | 'danger' }>> = {
  default: {},
  icon: {},
  success: {},
  destructive: { tone: 'danger' },
  outline: { variant: 'outline' },
  secondary: { variant: 'outline' },
  muted: { variant: 'outline' },
  'outline-muted': { variant: 'outline' },
  'outline-success': { variant: 'outline' },
  'surface-primary': { variant: 'outline', tone: 'accent' },
  'outline-destructive': { variant: 'outline', tone: 'danger' },
  ghost: { variant: 'ghost' },
  'ghost-muted': { variant: 'ghost' },
  'soft-muted': { variant: 'ghost' },
  'ghost-primary': { variant: 'ghost', tone: 'accent' },
  'ghost-muted-primary': { variant: 'ghost', tone: 'accent' },
  'soft-primary': { variant: 'ghost', tone: 'accent' },
  'quiet-primary': { variant: 'ghost', tone: 'accent' },
  'ghost-destructive': { variant: 'ghost', tone: 'danger' },
  'ghost-muted-destructive': { variant: 'ghost', tone: 'danger' },
  link: { variant: 'link', tone: 'accent' },
};

const BUTTON_SIZES: Readonly<Record<string, 'sm' | 'lg' | null>> = { xs: 'sm', sm: 'sm', default: null, lg: 'lg' };

const MANUAL_BUTTON_SIZES = new Set(['icon', 'icon-sm', 'unstyled']);

const buttonRule = (tag: string, renameTo?: string): TagRule => ({
  tag,
  renameTo,
  keys: ['variant', 'size'],
  transform: (attrs) => {
    if (MANUAL_BUTTON_SIZES.has(attrs.size ?? '') || attrs.variant === 'unstyled') return 'manual';

    const mapped = BUTTON_VARIANTS[attrs.variant ?? 'default'];
    if (!mapped) throw new Error(`Unknown Button variant "${attrs.variant}"`);

    const out: Record<string, AttrValue> = {};
    if (mapped.variant) out.variant = mapped.variant;
    if (mapped.tone) out.tone = mapped.tone;

    if (attrs.size === 'full') out.fullWidth = true;
    else if (attrs.size !== undefined) {
      if (!(attrs.size in BUTTON_SIZES)) throw new Error(`Unknown Button size "${attrs.size}"`);
      const size = BUTTON_SIZES[attrs.size];
      if (size) out.size = size;
    }

    return out;
  },
});

/** Rule sets applied with `pnpm ds:migrate <set>`. Each Plan A task adds its set. */
export const RULE_SETS: Record<string, ReadonlyArray<TagRule>> = {
  button: [buttonRule('Button'), buttonRule('LoadingButton', 'Button')],
};
