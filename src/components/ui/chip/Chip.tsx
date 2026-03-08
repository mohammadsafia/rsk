import { type ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

export type ChipVariants = VariantProps<typeof chipVariants>;

export type ChipProps = ComponentPropsWithoutRef<'div'> & ChipVariants;

export const chipVariants = cva(
  'inline-flex items-center rounded-md border border-transparent transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-primary-25 text-primary hover:bg-accent/45',
        success: 'bg-success-300 text-success hover:bg-success/45',
        destructive: 'bg-destructive-300 text-destructive hover:bg-destructive/45',
        warning: 'bg-warning-200 text-warning hover:bg-warning/45',
        accent: 'bg-accent-200 text-accent hover:bg-accent/45',
        muted: 'bg-muted-200 text-primary-900 hover:bg-muted/45',
      },
      size: {
        default: 'px-3 py-0.5 text-xs',
        xs: 'px-2 py-0.5 text-2xs',
        sm: 'px-2.5 py-1 text-sm',
        md: 'px-3 py-1.5 text-md',
        lg: 'px-3.5 py-2 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Chip = ({ className, variant, size, ...props }: ChipProps) => {
  return <div data-slot="chip" className={cn(chipVariants({ variant, size }), className)} {...props} />;
};

export default Chip;
