import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { checkboxBoxClassName } from '@components/ui';

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
      'group/checkbox-item border-border bg-surface text-fg flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
      'focus-ring hover:not-disabled:border-border-strong',
      'data-[state=checked]:border-accent data-[state=checked]:bg-accent-subtle',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
  </CheckboxPrimitive.Root>
);

const Indicator = ({ className, children, ...props }: CheckboxGroupIndicatorProps) => (
  <CheckboxPrimitive.Indicator data-slot="checkbox-group-indicator" className={cn(checkboxBoxClassName, className)} forceMount {...props}>
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
