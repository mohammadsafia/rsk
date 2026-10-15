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
