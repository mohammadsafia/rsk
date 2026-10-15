import { type ComponentPropsWithoutRef } from 'react';

import { Conditional } from '@components/utils';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

export const badgeVariants = cva('inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium whitespace-nowrap', {
  variants: {
    variant: {
      dot: 'border-border text-fg border',
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
      sm: 'h-5 px-1.5 text-2xs',
      md: 'h-5.5 px-2 text-xs',
    },
  },
  compoundVariants: [
    { variant: 'dot', tone: 'neutral', className: '*:data-[slot=badge-dot]:bg-fg-muted' },
    { variant: 'dot', tone: 'accent', className: '*:data-[slot=badge-dot]:bg-accent' },
    { variant: 'dot', tone: 'success', className: '*:data-[slot=badge-dot]:bg-success' },
    { variant: 'dot', tone: 'warning', className: '*:data-[slot=badge-dot]:bg-warning' },
    { variant: 'dot', tone: 'danger', className: '*:data-[slot=badge-dot]:bg-danger' },
    { variant: 'dot', tone: 'info', className: '*:data-[slot=badge-dot]:bg-info' },
    { variant: 'soft', tone: 'neutral', className: 'bg-surface-sunken text-fg' },
    { variant: 'soft', tone: 'accent', className: 'bg-accent-subtle text-accent' },
    { variant: 'soft', tone: 'success', className: 'bg-success-subtle text-success' },
    { variant: 'soft', tone: 'warning', className: 'bg-warning-subtle text-warning' },
    { variant: 'soft', tone: 'danger', className: 'bg-danger-subtle text-danger' },
    { variant: 'soft', tone: 'info', className: 'bg-info-subtle text-info' },
  ],
  defaultVariants: {
    variant: 'dot',
    tone: 'neutral',
    size: 'md',
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export type BadgeProps = ComponentPropsWithoutRef<'span'> & BadgeVariants;

const Badge = ({ className, variant, tone, size, children, ...props }: BadgeProps) => (
  <span
    data-slot="badge"
    data-variant={variant ?? 'dot'}
    data-tone={tone ?? 'neutral'}
    className={cn(badgeVariants({ variant, tone, size }), className)}
    {...props}
  >
    <Conditional.If condition={(variant ?? 'dot') === 'dot'}>
      <span data-slot="badge-dot" aria-hidden="true" className="size-1.5 shrink-0 rounded-full" />
    </Conditional.If>

    {children}
  </span>
);

export default Badge;
