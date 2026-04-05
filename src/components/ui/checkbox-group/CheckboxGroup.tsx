import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cn } from '@utils';

type CheckboxGroupItemProps = ComponentProps<typeof CheckboxPrimitive.Root>;

type CheckboxGroupIndicatorProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator>;

type CheckboxGroupProps = ComponentPropsWithoutRef<'div'>;

type CheckboxGroupComponent = FC<CheckboxGroupProps> & {
  Item: FC<CheckboxGroupItemProps>;
  Indicator: FC<CheckboxGroupIndicatorProps>;
};

const Item: FC<CheckboxGroupItemProps> = ({ ref, className, children, ...props }) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-slot="checkbox-group-item"
    className={cn(
      'group/checkbox-item border-muted-200 bg-muted-50 flex cursor-pointer items-center gap-5 rounded-md border p-3 transition-[color,box-shadow]',
      'data-[state=checked]:border-primary-200 data-[state=checked]:bg-primary-15',
      'hover:border-primary-200 hover:ring-primary/40 hover:ring focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
      'data-[state=checked]:hover:border-primary-200 data-[state=checked]:hover:ring-primary/40',
      'disabled:opacity-50 disabled:pointer-events-none',
      className,
    )}
    {...props}
  >
    {children}
  </CheckboxPrimitive.Root>
);

const Indicator = ({ className, children, ...props }: CheckboxGroupIndicatorProps) => (
  <CheckboxPrimitive.Indicator
    data-slot="checkbox-group-indicator"
    className={cn(
      'border-muted-200 bg-muted-50 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-[color,box-shadow] outline-none',
      'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      'group-hover/checkbox-item:border-primary-200 group-hover/checkbox-item:ring-primary/40 group-hover/checkbox-item:ring',
      'data-[state=checked]:group-hover/checkbox-item:border-primary data-[state=checked]:group-hover/checkbox-item:ring-primary/40',
      'group-disabled/checkbox-item:opacity-50',
      className,
    )}
    forceMount
    {...props}
  >
    {children}
  </CheckboxPrimitive.Indicator>
);

const CheckboxGroup: CheckboxGroupComponent = ({ className, children, ...props }) => (
  <div data-slot="checkbox-group" className={cn('grid w-full gap-3', className)} {...props}>
    {children}
  </div>
);

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
CheckboxGroup.Item = forwardRef<HTMLButtonElement, CheckboxGroupItemProps>((props, ref) => Item({ ...props, ref }));
CheckboxGroup.Indicator = Indicator;

CheckboxGroup.Item.displayName = 'CheckboxGroupItem';
Indicator.displayName = 'CheckboxGroupIndicator';
CheckboxGroup.displayName = 'CheckboxGroup';

export default CheckboxGroup;
