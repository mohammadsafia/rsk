'use client';

import { type ComponentPropsWithoutRef } from 'react';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { badgeVariants, type BadgeVariants } from './variants';

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
