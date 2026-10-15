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
