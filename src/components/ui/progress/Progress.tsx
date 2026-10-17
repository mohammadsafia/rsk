import { type ComponentPropsWithoutRef, type FC } from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const progressVariants = cva('bg-border relative w-full overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-1.5',
      lg: 'h-2',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const progressIndicatorVariants = cva(
  'duration-base ease-out h-full w-full origin-left rounded-full transition-transform rtl:origin-right',
  {
    variants: {
      tone: {
        accent: 'bg-accent',
        neutral: 'bg-fg',
        success: 'bg-success',
        danger: 'bg-danger',
      },
    },
    defaultVariants: {
      tone: 'accent',
    },
  },
);

type ProgressProps = Omit<ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value' | 'max'> &
  VariantProps<typeof progressVariants> &
  VariantProps<typeof progressIndicatorVariants> & {
    value: number;
    fullValue?: number;
  };

const Progress: FC<ProgressProps> = ({ className, value, fullValue = 100, size, tone, ...props }) => {
  const ratio = Math.min(1, Math.max(0, value / fullValue));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone ?? 'accent'}
      value={Math.min(value, fullValue)}
      max={fullValue}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={progressIndicatorVariants({ tone })}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </ProgressPrimitive.Root>
  );
};

export default Progress;
