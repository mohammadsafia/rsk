'use client';

import { type ComponentPropsWithoutRef, type FC } from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const switchRootVariants = cva(
  [
    'peer group/switch bg-border duration-base inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
    'focus-ring data-[state=checked]:bg-fg disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-3.5 w-6.5',
        md: 'h-4.5 w-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const switchThumbVariants = cva(
  [
    'bg-fg-muted data-[state=checked]:bg-fg-inverse pointer-events-none block rounded-full',
    // Springs across; while pressed it stretches toward where it will travel (from its trailing edge, mirrored in RTL).
    'duration-spring ease-spring transition-[translate,scale,background-color] motion-reduce:transition-none',
    'origin-left data-[state=checked]:origin-right rtl:origin-right rtl:data-[state=checked]:origin-left',
    'group-active/switch:scale-x-125 motion-reduce:group-active/switch:scale-x-100',
  ],
  {
    variants: {
      size: {
        sm: 'size-2.5 translate-x-0.5 data-[state=checked]:translate-x-3 rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-3',
        md: 'size-3.5 translate-x-0.5 data-[state=checked]:translate-x-3.5 rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-3.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & VariantProps<typeof switchRootVariants>;

const Switch: FC<SwitchProps> = ({ className, size, ...props }) => (
  <SwitchPrimitives.Root data-slot="switch" className={cn(switchRootVariants({ size }), className)} {...props}>
    <SwitchPrimitives.Thumb data-slot="switch-thumb" className={switchThumbVariants({ size })} />
  </SwitchPrimitives.Root>
);

export default Switch;
