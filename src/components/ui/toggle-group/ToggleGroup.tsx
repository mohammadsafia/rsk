import { type ComponentPropsWithoutRef, createContext, type FC, type ReactNode, useContext } from 'react';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import InkBar from '../ink-bar/InkBar';

const toggleVariants = cva(
  [
    'text-fg-muted inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition-colors [&_svg]:size-4',
    'focus-ring hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-50',
    'data-[state=on]:text-fg',
  ],
  {
    variants: {
      variant: {
        outline: 'border-border-strong data-[state=on]:border-accent border',
        ghost: '',
      },
      size: {
        sm: 'h-control-sm px-2.5 text-xs',
        md: 'h-control-md px-3 text-sm',
        lg: 'h-control-lg px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'md',
    },
  },
);

type ToggleGroupContextValue = VariantProps<typeof toggleVariants>;

type ToggleGroupItemProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants> & {
    children: ReactNode;
  };

type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    children: ReactNode;
  };

const ToggleGroupContext = createContext<ToggleGroupContextValue>({ variant: 'outline', size: 'md' });

const Item: FC<ToggleGroupItemProps> = ({ className, children, variant, size, ...props }) => {
  const context = useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant: variant ?? context.variant, size: size ?? context.size }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
};

const ToggleGroup: FC<ToggleGroupProps> & { Item: FC<ToggleGroupItemProps> } = ({ className, variant, size, children, ...props }) => (
  <ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn('relative flex items-center gap-1', className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant: variant ?? 'outline', size: size ?? 'md' }}>{children}</ToggleGroupContext.Provider>
    <InkBar selector='[data-state="on"]' />
  </ToggleGroupPrimitive.Root>
);

ToggleGroup.Item = Item;

export default ToggleGroup;
