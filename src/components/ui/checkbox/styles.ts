// Shared class names: plain strings, usable from any module.

/** The 16px checkbox square, shared with CheckboxGroup.Indicator. State comes from Radix `data-state`. */
export const checkboxBoxClassName = [
  'border-border-strong bg-surface text-fg-inverse flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
  'data-[state=checked]:border-fg data-[state=checked]:bg-fg',
  'data-[state=indeterminate]:border-fg data-[state=indeterminate]:bg-fg',
  'aria-invalid:border-danger in-aria-invalid:border-danger',
].join(' ');
