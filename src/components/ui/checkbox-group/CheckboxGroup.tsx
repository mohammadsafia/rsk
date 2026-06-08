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
      'group/checkbox-item border-muted-200 bg-background flex cursor-pointer items-center gap-5 rounded-md border p-3 transition-[color,box-shadow]',
      'data-[state=checked]:border-primary-50 data-[state=checked]:bg-primary-15',
      'hover:border-primary hover:ring-primary focus-visible:ring-primary focus-visible:border-primary hover:ring focus-visible:ring focus-visible:outline-none',
      'data-[state=checked]:hover:border-primary data-[state=checked]:hover:ring-primary data-[state=checked]:focus-visible:border-primary data-[state=checked]:focus-visible:ring-primary',
      'disabled:bg-muted-50 disabled:text-muted-300 disabled:pointer-events-none',
      'disabled:data-[state=checked]:bg-muted-50 disabled:data-[state=checked]:border-muted-200',
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
      'border-muted-200 bg-background flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-[color,box-shadow] outline-none',
      'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary-300 dark:data-[state=checked]:border-primary-300',
      'group-hover/checkbox-item:border-primary group-hover/checkbox-item:ring-primary group-hover/checkbox-item:ring',
      'data-[state=checked]:group-hover/checkbox-item:border-primary data-[state=checked]:group-hover/checkbox-item:ring-primary',
      'group-disabled/checkbox-item:data-[state=checked]:bg-muted-400 group-disabled/checkbox-item:data-[state=checked]:border-muted-400',
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
