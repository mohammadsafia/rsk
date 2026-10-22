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
  { token: 'rule-strong', group: 'line', description: 'Ledger heavy rule: the top edge of grouped surfaces (≥3:1)' },
  { token: 'fg-hover', group: 'action', description: 'Primary action fill on hover (bg-fg solid step)' },
  { token: 'fg-pressed', group: 'action', description: 'Primary action fill while pressed' },
  { token: 'accent', group: 'accent', description: 'Oxblood: links, selection, focus' },
  { token: 'accent-fg', group: 'accent', description: 'Text on accent fill' },
  { token: 'accent-hover', group: 'accent', description: 'Solid accent fill on hover' },
  { token: 'accent-subtle', group: 'accent', description: 'Selection tint' },
  { token: 'ring', group: 'accent', description: 'Focus outline (solid, ≥3:1)' },
  { token: 'ring-subtle', group: 'accent', description: 'Focus glow (decorative)' },
  { token: 'ink', group: 'accent', description: 'Ledger ink: the one mark for current and selected (≥3:1)' },
  { token: 'success', group: 'status', description: 'Success text and fill' },
  { token: 'success-subtle', group: 'status', description: 'Success tint' },
  { token: 'success-fg', group: 'status', description: 'Text on success fill' },
  { token: 'warning', group: 'status', description: 'Warning text and fill' },
  { token: 'warning-subtle', group: 'status', description: 'Warning tint' },
  { token: 'warning-fg', group: 'status', description: 'Text on warning fill' },
  { token: 'danger', group: 'status', description: 'Vermilion: errors and destructive actions' },
  { token: 'danger-subtle', group: 'status', description: 'Danger tint' },
  { token: 'danger-fg', group: 'status', description: 'Text on danger fill' },
  { token: 'danger-hover', group: 'status', description: 'Solid danger fill on hover' },
  { token: 'info', group: 'status', description: 'Steel: informational text and fill' },
  { token: 'info-subtle', group: 'status', description: 'Info tint' },
  { token: 'info-fg', group: 'status', description: 'Text on info fill' },
  { token: 'hover', group: 'state', description: 'Hover overlay' },
  { token: 'pressed', group: 'state', description: 'Pressed overlay' },
];

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
  { token: 'text-figure', size: '1.875rem', lineHeight: '2.0625rem', px: 30, use: 'Ledger figures: stat and progress values' },
];

export const FONT_FAMILIES = {
  sans: "var(--font-brand-sans, 'Schibsted Grotesk'), var(--font-brand-arabic, 'Noto Kufi Arabic'), system-ui, sans-serif",
  mono: "var(--font-brand-mono, 'Spline Sans Mono'), ui-monospace, 'SFMono-Regular', monospace",
} as const;

export type FoundationScaleStep = Readonly<{
  token: string;
  value: string;
  use: string;
}>;

export const RADIUS_SCALE: ReadonlyArray<FoundationScaleStep> = [
  { token: 'radius-sm', value: '0.125rem', use: 'Checkbox, kbd, menu items' },
  { token: 'radius-md', value: '0.125rem', use: 'Controls: Ledger keeps edges square' },
  { token: 'radius-lg', value: '0.25rem', use: 'Cards, popovers, dialogs, sheets' },
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
  { token: 'duration-instant', value: '100ms', use: 'Popover and tooltip exits' },
  { token: 'duration-fast', value: '120ms', use: 'Hover, press, exits, popover entries' },
  { token: 'duration-base', value: '180ms', use: 'Standard entries: dialogs, menus, slides' },
  { token: 'duration-exit', value: '200ms', use: 'Large surface exits: sheets' },
  { token: 'duration-slow', value: '260ms', use: 'Sheet entries, chart updates' },
  { token: 'duration-spring', value: '380ms', use: 'Expressive arrivals (spring easing)' },
  { token: 'duration-spring-long', value: '420ms', use: 'Sheet spring, section reveal' },
  { token: 'duration-roll', value: '520ms', use: 'Rolling figures' },
];

export const STATE_UTILITIES: ReadonlyArray<FoundationScaleStep> = [
  { token: 'focus-ring', value: '2px solid ring + 2px offset', use: 'Buttons, links, toggles' },
  { token: 'focus-ring-input', value: 'fg border + 2px ink underline', use: 'Inputs and input-like triggers (Ledger: the active field)' },
  { token: 'state-invalid', value: 'danger border + danger-subtle glow', use: 'aria-invalid controls (always with a message)' },
  { token: 'state-press', value: 'scale(0.98) on :active', use: 'Pressable controls' },
];

/** Ledger signature marks (spec docs/superpowers/specs/2026-10-17-ledger-signature-design.md). One mark, one job. */
export const SIGNATURE_MARKS: ReadonlyArray<FoundationScaleStep> = [
  { token: 'ink', value: '2px ink underline, 4px offset', use: 'Current / selected text: the only state mark' },
  { token: 'ink-block', value: '2px ink bar under the element, draws in', use: 'Active tab, current page, current nav item' },
  { token: 'rule-top', value: '2px heavy rule on top, draws in', use: 'Toasts, stat cards, card headers, events, tooltips' },
  { token: 'rule-top-section', value: 'rule-top at 3px', use: 'Dialogs, sheets, page sections' },
  { token: 'rule-top-ink', value: 'rule-top in ink', use: 'Rules on inverse surfaces (tooltip)' },
  { token: 'figure', value: 'mono 30px tabular, -0.03em', use: 'Values that matter: stats, progress' },
  { token: 'smallcaps', value: 'uppercase, 0.08em tracking', use: 'Tabs, badges, section labels, table headers' },
  { token: 'underline-tone', value: '1.5px underline in currentColor', use: 'Badges: status without a box' },
  { token: 'sections', value: 'counter-reset', use: 'A group whose children are numbered 01, 02, …' },
  { token: 'section-number', value: 'mono 10.5px counter, fg-subtle', use: 'The number of a structural section' },
];
