import { type ComponentPropsWithoutRef, type FC } from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & VariantProps<typeof switchRootVariants>;

type SwitchComponent = FC<SwitchProps>;

const switchRootVariants = cva(
  `peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs
  transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted`,
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
      variant: {
        default: 'data-[state=checked]:bg-primary',
        success: 'data-[state=checked]:bg-success',
        destructive: 'data-[state=checked]:bg-destructive',
        secondary: 'data-[state=checked]:bg-secondary',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  },
);

const switchThumbVariants = cva('pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform', {
  variants: {
    size: {
      sm: 'h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0',
      md: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
      lg: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const Switch: SwitchComponent = ({ className, size, variant, ...props }) => {
  return (
    <SwitchPrimitives.Root data-slot="switch" className={cn(switchRootVariants({ size, variant, className }))} {...props}>
      <SwitchPrimitives.Thumb data-slot="switch-thumb" className={cn(switchThumbVariants({ size }))} />
    </SwitchPrimitives.Root>
  );
};

export default Switch;
