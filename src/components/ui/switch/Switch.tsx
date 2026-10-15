import { type ComponentPropsWithoutRef, type FC } from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

const switchRootVariants = cva(
  [
    'peer bg-border inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors',
    'focus-ring data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
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
  'bg-fg-muted data-[state=checked]:bg-accent-fg duration-fast pointer-events-none block rounded-full transition-transform',
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
