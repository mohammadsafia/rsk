'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const progressVariants = cva('bg-border relative w-full overflow-hidden', {
  variants: {
    size: {
      sm: 'h-0.5',
      md: 'h-0.75',
      lg: 'h-1',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const progressIndicatorVariants = cva('duration-base ease-out h-full w-full origin-left transition-transform rtl:origin-right', {
  variants: {
    tone: {
      accent: 'bg-accent',
      neutral: 'bg-fg',
      success: 'bg-success',
      danger: 'bg-danger',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

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
      data-tone={tone ?? 'neutral'}
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
