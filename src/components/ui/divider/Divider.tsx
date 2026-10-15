import { type ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

export const dividerVariants = cva('m-0 border-0', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-auto w-px self-stretch',
    },
    variant: {
      solid: 'bg-border',
      dashed: 'border-border border-t border-dashed bg-transparent',
    },
  },
  compoundVariants: [
    {
      orientation: 'vertical',
      variant: 'dashed',
      className: 'border-s border-t-0',
    },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
  },
});

export type DividerVariants = VariantProps<typeof dividerVariants>;

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
