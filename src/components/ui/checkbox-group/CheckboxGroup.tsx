import { type ComponentProps, type FC, type ReactNode, type RefCallback } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cn } from '@utils';

type CheckboxGroupItemProps = ComponentProps<typeof CheckboxPrimitive.Root> & {
  ref?: RefCallback<HTMLButtonElement>;
  children: ReactNode;
};

type CheckboxGroupIndicatorProps = ComponentProps<typeof CheckboxPrimitive.Indicator> & {
  children: ReactNode;
};

type CheckboxGroupComponent = FC<{ className?: string; children: ReactNode }> & {
  Item: FC<CheckboxGroupItemProps>;
  Indicator: FC<CheckboxGroupIndicatorProps>;
};

const CheckboxGroup: CheckboxGroupComponent = ({ className, children }) => (
  <div data-slot="checkbox-group" className={cn('grid w-full gap-2', className)}>
    {children}
  </div>
);

const Item = ({ ref, className, children, ...props }: CheckboxGroupItemProps) => (
  <CheckboxPrimitive.Root
    ref={(el) => ref?.(el)}
    data-slot="checkbox-group-item"
    className={cn(
      'group/checkbox-item border-muted-200 bg-surface-500 flex h-10.5 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 outline-none',
      'data-[state=checked]:bg-secondary-100',
      'focus-visible:ring-ring focus-visible:ring-2',
      'disabled:bg-muted-50 disabled:cursor-not-allowed disabled:opacity-70',
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
    className={cn('flex shrink-0 items-center justify-center', className)}
    forceMount
    {...props}
  >
    {children}
  </CheckboxPrimitive.Indicator>
);

CheckboxGroup.Item = Item;
CheckboxGroup.Indicator = Indicator;

Item.displayName = 'CheckboxGroupItem';
Indicator.displayName = 'CheckboxGroupIndicator';
CheckboxGroup.displayName = 'CheckboxGroup';

export default CheckboxGroup;
