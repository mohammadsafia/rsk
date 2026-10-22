'use client';

import { type ComponentPropsWithoutRef } from 'react';

import { cn } from '@utils';

import { dividerVariants, type DividerVariants } from './variants';

export type DividerProps = ComponentPropsWithoutRef<'hr'> & DividerVariants;

const Divider = ({ className, orientation, variant, ...props }: DividerProps) => (
  <hr
    data-slot="divider"
    aria-orientation={orientation ?? 'horizontal'}
    className={cn(dividerVariants({ orientation, variant }), className)}
    {...props}
  />
);

export default Divider;
