import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type ProgressProps = ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> & {
    value: number;
    fullValue?: number;
    indicatorVariant?: VariantProps<typeof progressIndicatorVariants>['variant'];
  };

type ProgressComponent = FC<ProgressProps>;

const progressVariants = cva('relative w-full overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'h-2',
      md: 'h-4',
      lg: 'h-6',
    },
    variant: {
      default: 'bg-border',
      success: 'bg-success',
      destructive: 'bg-destructive',
      secondary: 'bg-secondary',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

const progressIndicatorVariants = cva('h-full animate-in duration-500', {
  variants: {
    variant: {
      default: 'bg-primary',
      success: 'bg-success',
      destructive: 'bg-destructive',
      secondary: 'bg-secondary',
      accent: 'bg-accent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const Progress: ProgressComponent = ({ className, value, fullValue = 100, size, variant, indicatorVariant, ...props }) => {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn(progressVariants({ variant, size, className }))} {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressIndicatorVariants({ variant: indicatorVariant }))}
        style={{ transform: `translateX(-${100 - (value / fullValue) * 100}%)` }}
      />
    </ProgressPrimitive.Root>
  );
};

export default Progress;
