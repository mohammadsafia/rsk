import { cva } from 'class-variance-authority';

export const tagVariants = cva('bg-surface inline-flex shrink-0 items-center gap-1 rounded-md border font-medium whitespace-nowrap', {
  variants: {
    tone: {
      neutral: 'border-border text-fg',
      accent: 'border-border text-accent',
      success: 'border-border text-success',
      warning: 'border-border text-warning',
      danger: 'border-border text-danger',
      info: 'border-border text-info',
    },
    size: {
      sm: 'h-5 px-1.5 text-2xs',
      md: 'h-6 px-2 text-xs',
    },
    interactive: {
      true: 'focus-ring cursor-pointer hover:bg-hover',
      false: '',
    },
    selected: {
      true: 'border-fg text-fg ink',
      false: '',
    },
    removable: {
      true: 'pe-0.5',
      false: '',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    size: 'md',
    interactive: false,
    selected: false,
    removable: false,
  },
});
