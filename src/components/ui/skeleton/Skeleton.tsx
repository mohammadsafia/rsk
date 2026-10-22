'use client';

import { type FC, type HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const skeletonVariants = cva('bg-border-subtle shimmer', {
  variants: {
    shape: {
      line: 'w-full rounded-sm',
      circle: 'shrink-0 rounded-full',
      block: 'w-full rounded-md',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { shape: 'line', size: 'sm', className: 'h-3' },
    { shape: 'line', size: 'md', className: 'h-3.5' },
    { shape: 'line', size: 'lg', className: 'h-4.5' },
    { shape: 'circle', size: 'sm', className: 'size-6' },
    { shape: 'circle', size: 'md', className: 'size-8' },
    { shape: 'circle', size: 'lg', className: 'size-10' },
    { shape: 'block', size: 'sm', className: 'h-16' },
    { shape: 'block', size: 'md', className: 'h-24' },
    { shape: 'block', size: 'lg', className: 'h-40' },
  ],
  defaultVariants: {
    shape: 'line',
    size: 'md',
  },
});

type SkeletonProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>;

const Skeleton: FC<SkeletonProps> = ({ className, shape, size, ...props }) => (
  <div
    aria-hidden="true"
    data-slot="skeleton"
    data-shape={shape ?? 'line'}
    data-size={size ?? 'md'}
    className={cn(skeletonVariants({ shape, size }), className)}
    {...props}
  />
);

export default Skeleton;
