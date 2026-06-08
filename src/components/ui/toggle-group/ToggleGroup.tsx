import { type ComponentPropsWithoutRef, createContext, type FC, type ReactNode, useContext } from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type ToggleGroupContextValue = VariantProps<typeof toggleVariants>;

type ToggleGroupItemProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants> & {
    children: ReactNode;
  };

type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    children: ReactNode;
  };

const toggleVariants = cva(
  `
  inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors text-primary cursor-pointer
  hover:bg-primary-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground dark:data-[state=on]:bg-primary-300
  [&>svg]:text-primary data-[state=on]:[&>svg]:text-primary-foreground
  `,
  {
    variants: {
      variant: {
        default: 'bg-primary-25',
        outline: 'border border-accent text-accent-foreground bg-transparent shadow-xs hover:bg-accent',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: 'default',
  variant: 'default',
});

const Item: FC<ToggleGroupItemProps> = ({ className, children, variant, size, ...props }) => {
  const context = useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant: context.variant || variant, size: context.size || size }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
};

const ToggleGroup: FC<ToggleGroupProps> & { Item: FC<ToggleGroupItemProps> } = ({ className, variant, size, children, ...props }) => (
  <ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn('flex items-center justify-center gap-1', className)} {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
);

ToggleGroup.Item = Item;

export default ToggleGroup;
