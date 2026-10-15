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

const BADGE_TONES: Readonly<Record<string, string | null>> = {
  default: null,
  secondary: null,
  muted: null,
  neutral: null,
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  destructive: 'danger',
};

const BADGE_SIZES: Readonly<Record<string, 'sm' | 'md'>> = { default: 'sm', xs: 'sm', sm: 'sm', md: 'md', lg: 'md' };

/** Chip variants (also used by FileCard.StatusPill) → tone. */
const CHIP_TONES: Readonly<Record<string, string | null>> = {
  default: 'accent',
  secondary: null,
  muted: null,
  success: 'success',
  destructive: 'danger',
  warning: 'warning',
  accent: 'info',
};

const CHIP_SIZES: Readonly<Record<string, 'sm' | 'md'>> = { xxs: 'sm', xs: 'sm', sm: 'sm', default: 'md', md: 'md', lg: 'md' };

const lookup = <T>(table: Readonly<Record<string, T>>, value: string, label: string): T => {
  if (!(value in table)) throw new Error(`Unknown ${label} "${value}"`);
  return table[value];
};

const badgeRule: TagRule = {
  tag: 'Badge',
  keys: ['variant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    const tone = lookup(BADGE_TONES, attrs.variant ?? 'default', 'Badge variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) out.size = lookup(BADGE_SIZES, attrs.size, 'Badge size');
    return out;
  },
};

const statusPillRule: TagRule = {
  tag: 'FileCard.StatusPill',
  keys: ['variant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = { variant: 'soft' };
    const tone = lookup(CHIP_TONES, attrs.variant ?? 'default', 'StatusPill variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) out.size = lookup(CHIP_SIZES, attrs.size, 'StatusPill size');
    return out;
  },
};

const chipRule: TagRule = {
  tag: 'Chip',
  renameTo: 'Tag',
  importRename: { source: '@components/ui', from: 'Chip', to: 'Tag' },
  keys: ['variant', 'size'],
  transform: (attrs) => {
    if (attrs.size === 'unstyled') return 'manual';
    const out: Record<string, AttrValue> = {};
    const tone = lookup(CHIP_TONES, attrs.variant ?? 'default', 'Chip variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) {
      const size = lookup(CHIP_SIZES, attrs.size, 'Chip size');
      if (size !== 'md') out.size = size;
    }
    return out;
  },
};

const ALERT_VARIANTS: Readonly<Record<string, { variant?: 'outline'; tone?: string }>> = {
  default: {},
  info: { tone: 'info' },
  success: { tone: 'success' },
  warning: { tone: 'warning' },
  destructive: { tone: 'danger' },
  outline: { variant: 'outline' },
  'outline-info': { variant: 'outline', tone: 'info' },
  'outline-success': { variant: 'outline', tone: 'success' },
  'outline-destructive': { variant: 'outline', tone: 'danger' },
};

const alertRule: TagRule = {
  tag: 'Alert',
  keys: ['variant'],
  transform: (attrs) => {
    const mapped = lookup(ALERT_VARIANTS, attrs.variant ?? 'default', 'Alert variant');
    const out: Record<string, AttrValue> = {};
    if (mapped.variant) out.variant = mapped.variant;
    if (mapped.tone) out.tone = mapped.tone;
    return out;
  },
};

const PROGRESS_TONES: Readonly<Record<string, string | null>> = {
  default: null,
  accent: null,
  success: 'success',
  destructive: 'danger',
  secondary: 'neutral',
};

const progressRule: TagRule = {
  tag: 'Progress',
  keys: ['variant', 'indicatorVariant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    const tone = lookup(PROGRESS_TONES, attrs.indicatorVariant ?? attrs.variant ?? 'default', 'Progress variant');
    if (tone) out.tone = tone;
    if (attrs.size !== undefined) out.size = attrs.size;
    return out;
  },
};

const SKELETON_SHAPES: Readonly<Record<string, string | null>> = {
  text: null,
  avatar: 'circle',
  banner: 'block',
  thumbnail: 'block',
  square: 'block',
  rectangle: 'block',
  squareSharp: 'block',
  rectangleSharp: 'block',
};

const SKELETON_SIZES: Readonly<Record<string, string | null>> = { xs: 'sm', sm: 'sm', default: null, md: null, lg: 'lg', xl: 'lg' };

const skeletonRule: TagRule = {
  tag: 'Skeleton',
  keys: ['variant', 'size', 'shape'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    const shape = lookup(SKELETON_SHAPES, attrs.shape ?? 'text', 'Skeleton shape');
    if (shape) out.shape = shape;
    const size = lookup(SKELETON_SIZES, attrs.size ?? 'default', 'Skeleton size');
    if (size) out.size = size;
    return out;
  },
};

const switchRule: TagRule = {
  tag: 'Switch',
  keys: ['variant', 'size'],
  transform: (attrs): Record<string, AttrValue> => (attrs.size === undefined ? {} : { size: attrs.size === 'sm' ? 'sm' : 'md' }),
};

const checkboxRule: TagRule = {
  tag: 'Checkbox',
  keys: ['variant'],
  transform: () => ({}),
};

const TOGGLE_VARIANTS: Readonly<Record<string, 'ghost' | null>> = { default: 'ghost', outline: null };

const TOGGLE_SIZES: Readonly<Record<string, 'sm' | 'lg' | null>> = { default: null, sm: 'sm', lg: 'lg' };

const toggleRule = (tag: string): TagRule => ({
  tag,
  keys: ['variant', 'size'],
  transform: (attrs) => {
    const out: Record<string, AttrValue> = {};
    if (attrs.variant !== undefined) {
      const variant = lookup(TOGGLE_VARIANTS, attrs.variant, 'ToggleGroup variant');
      if (variant) out.variant = variant;
    }
    if (attrs.size !== undefined) {
      const size = lookup(TOGGLE_SIZES, attrs.size, 'ToggleGroup size');
      if (size) out.size = size;
    }
    return out;
  },
});

/** Rule sets applied with `pnpm ds:migrate <set>`. Each Plan A task adds its set. */
const cardRule: TagRule = {
  tag: 'Card',
  keys: ['shadow'],
  // Cards no longer have a resting shadow (addendum §9); every value is dropped.
  transform: () => ({}),
};

const TABS_LIST: Readonly<Record<string, { variant?: 'contained'; fullWidth?: true }>> = {
  default: { variant: 'contained', fullWidth: true },
  compact: { variant: 'contained' },
  plain: { fullWidth: true },
  compactPlain: {},
};

const tabsListRule: TagRule = {
  tag: 'Tabs.List',
  keys: ['variant'],
  // A list without a variant used the old default, so it maps like `default`.
  transform: (attrs) => {
    const mapped = lookup(TABS_LIST, attrs.variant ?? 'default', 'Tabs.List variant');
    const out: Record<string, AttrValue> = {};
    if (mapped.variant) out.variant = mapped.variant;
    if (mapped.fullWidth) out.fullWidth = true;
    return out;
  },
};

const tabsTriggerRule: TagRule = {
  tag: 'Tabs.Trigger',
  keys: ['variant'],
  transform: () => ({}),
};

const CONFIRM_TONES: Readonly<Record<string, string>> = {
  destructive: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'info',
};

const confirmDialogRule: TagRule = {
  tag: 'ConfirmDialog',
  keys: ['variant'],
  transform: (attrs): Record<string, AttrValue> =>
    attrs.variant === undefined ? {} : { tone: lookup(CONFIRM_TONES, attrs.variant, 'ConfirmDialog variant') },
};

export const RULE_SETS: Record<string, ReadonlyArray<TagRule>> = {
  button: [buttonRule('Button'), buttonRule('LoadingButton', 'Button')],
  badge: [badgeRule, statusPillRule],
  tag: [chipRule],
  alert: [alertRule],
  feedback: [progressRule, skeletonRule, switchRule, checkboxRule],
  menus: [toggleRule('ToggleGroup'), toggleRule('ToggleGroup.Item')],
  card: [cardRule],
  tabs: [tabsListRule, tabsTriggerRule],
  confirm: [confirmDialogRule],
};
