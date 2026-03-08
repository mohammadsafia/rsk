import { type ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@utils';

export type DividerVariants = VariantProps<typeof dividerVariants>;

export type DividerProps = ComponentPropsWithoutRef<'hr'> & DividerVariants;

export const dividerVariants = cva('border-0 m-0', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px h-full',
    },
    variant: {
      solid: 'bg-muted-200',
      dashed: 'bg-transparent border-t border-muted-200 border-dashed',
    },
  },
  compoundVariants: [
    {
      orientation: 'vertical',
      variant: 'dashed',
      className: 'border-t-0 border-s border-muted-200 border-dashed',
    },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    variant: 'solid',
  },
});

const Divider = ({ className, orientation, variant, ...props }: DividerProps) => (
  <hr data-slot="divider" className={cn(dividerVariants({ orientation, variant }), className)} {...props} />
);

export default Divider;
