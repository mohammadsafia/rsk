import { cva, type VariantProps } from 'class-variance-authority';

export const badgeVariants = cva('smallcaps underline-tone inline-flex shrink-0 items-center gap-1.5 font-semibold whitespace-nowrap', {
  variants: {
    variant: {
      dot: 'text-fg',
      soft: '',
    },
    tone: {
      neutral: '',
      accent: '',
      success: '',
      warning: '',
      danger: '',
      info: '',
    },
    size: {
      sm: 'h-5 text-2xs',
      md: 'h-5.5 text-2xs tracking-widest',
    },
  },
  compoundVariants: [
    { variant: 'dot', tone: 'neutral', className: '*:data-[slot=badge-dot]:bg-fg-muted' },
    { variant: 'dot', tone: 'accent', className: '*:data-[slot=badge-dot]:bg-accent' },
    { variant: 'dot', tone: 'success', className: '*:data-[slot=badge-dot]:bg-success' },
    { variant: 'dot', tone: 'warning', className: '*:data-[slot=badge-dot]:bg-warning' },
    { variant: 'dot', tone: 'danger', className: '*:data-[slot=badge-dot]:bg-danger' },
    { variant: 'dot', tone: 'info', className: '*:data-[slot=badge-dot]:bg-info' },
    { variant: 'soft', tone: 'neutral', className: 'text-fg-muted' },
    { variant: 'soft', tone: 'accent', className: 'text-accent' },
    { variant: 'soft', tone: 'success', className: 'text-success' },
    { variant: 'soft', tone: 'warning', className: 'text-warning' },
    { variant: 'soft', tone: 'danger', className: 'text-danger' },
    { variant: 'soft', tone: 'info', className: 'text-info' },
  ],
  defaultVariants: {
    variant: 'dot',
    tone: 'neutral',
    size: 'md',
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;
