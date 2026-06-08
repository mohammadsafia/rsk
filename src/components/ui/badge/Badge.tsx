import { type ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@utils';

export type BadgeProps = ComponentPropsWithoutRef<'div'> & VariantProps<typeof badgeVariants>;

export const badgeVariants = cva('inline-flex items-center gap-1 font-normal text-muted-foreground', {
  variants: {
    size: {
      default: 'p-0 text-xs',
      xs: 'px-2 py-0.5 text-xs',
      sm: 'px-2.5 py-1 text-sm',
      md: 'px-3 py-1.5 text-md',
      lg: 'px-3.5 py-2 text-lg',
    },
    variant: {
      default: `**:data-[slot=badge-dot]:text-primary`,
      success: `**:data-[slot=badge-dot]:text-success`,
      destructive: `**:data-[slot=badge-dot]:text-destructive`,
      warning: `**:data-[slot=badge-dot]:text-warning`,
      muted: `**:data-[slot=badge-dot]:text-muted-foreground`,
      secondary: `**:data-[slot=badge-dot]:text-secondary`,
      neutral: `**:data-[slot=badge-dot]:text-primary-900`,
      accent: `**:data-[slot=badge-dot]:text-accent`,
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

const Badge = ({ className, variant, size, children, ...props }: BadgeProps) => {
  return (
    <div data-slot="badge" className={cn(badgeVariants({ variant, size }), className)} {...props}>
      <span data-slot="badge-dot" className="h-2 w-2 shrink-0 rounded-full bg-current" />
      {children}
    </div>
  );
};

export default Badge;
