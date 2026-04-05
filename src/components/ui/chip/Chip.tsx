import { type ComponentPropsWithoutRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn, DISABLED_STYLES } from '@utils';

export type ChipVariants = VariantProps<typeof chipVariants>;

export type ChipProps = ComponentPropsWithoutRef<'div'> & ChipVariants;

export const chipVariants = cva(
  `inline-flex items-center rounded-lg border border-transparent transition-colors outline-hidden shadow-sm font-semibold cursor-default ${DISABLED_STYLES}`,
  {
    variants: {
      variant: {
        default: 'bg-primary-25 text-primary hover:text-primary-foreground hover:bg-primary-400',
        success: 'bg-success-200 text-success hover:text-success-foreground hover:bg-success-400',
        destructive: 'bg-destructive-300 text-destructive hover:text-destructive-foreground hover:bg-destructive-400',
        warning: 'bg-warning-200 text-warning hover:text-warning-foreground hover:bg-warning-400',
        accent: 'bg-accent-200 text-accent hover:text-accent-foreground hover:bg-accent-400',
        muted: 'bg-muted-200 text-foreground hover:text-muted-foreground hover:bg-muted-400',
      },
      size: {
        default: 'px-3 py-0.5 text-xs',
        xxs: 'px-0.5 py-0.5 text-2xs leading-none',
        xs: 'px-2 py-0.5 text-2xs leading-none',
        sm: 'px-2.5 py-1 text-sm',
        md: 'px-3 py-1.5 text-md',
        lg: 'px-3.5 py-2 text-lg',
        unstyled: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Chip = ({ className, variant, size, ...props }: ChipProps) => (
  <div data-slot="chip" className={cn(chipVariants({ variant, size }), className)} {...props} />
);

export default Chip;
