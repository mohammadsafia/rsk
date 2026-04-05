import { type FC, type HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type SkeletonProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>;

type SkeletonComponent = FC<SkeletonProps>;

const skeletonVariants = cva('animate-pulse bg-muted overflow-hidden', {
  variants: {
    variant: {
      default: 'bg-muted-200',
      card: 'bg-card',
      primary: 'bg-primary/10',
    },
    size: {
      default: '[--skw:35px] [--skh2:35px] [--line:10px]',
      xs: '[--skw:20px] [--skh2:20px] [--line:5px]',
      sm: '[--skw:35px] [--skh2:35px] [--line:10px]',
      md: '[--skw:70px] [--skh2:70px] [--line:20px]',
      lg: '[--skw:140px] [--skh2:140px] [--line:40px]',
      xl: '[--skw:180px] [--skh2:180px] [--line:80px]',
    },
    shape: {
      text: 'w-full h-(--line) rounded-md',
      avatar: 'w-(--skw) h-(--skh2) rounded-full',
      banner: 'w-full h-[calc(var(--skh2)*2)] rounded-md',
      thumbnail: 'w-[calc(var(--skw)*1.6)] h-[calc(var(--skh2)*1.6)] rounded-md',
      square: 'w-(--skw) h-(--skh2) rounded-md',
      rectangle: 'w-[calc(var(--skw)*1.14)] h-[calc(var(--skh2)*0.57)] rounded-md',
      squareSharp: 'w-[calc(var(--skw)*1.6)] h-[calc(var(--skh2)*1.6)] rounded-none',
      rectangleSharp: 'w-[calc(var(--skw)*1.14)] h-[calc(var(--skh2)*0.57)] rounded-none',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    shape: 'text',
  },
});

const Skeleton: SkeletonComponent = ({ className, variant, size, shape, ...props }) => {
  return <div data-slot="skeleton" className={cn(skeletonVariants({ variant, size, shape }), className)} {...props} />;
};

export default Skeleton;
