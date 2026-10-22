'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, createContext, type FC, use } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { checkboxBoxClassName } from '@components/ui';

import { cn } from '@utils';

type CheckboxGroupItemProps = ComponentProps<typeof CheckboxPrimitive.Root>;

type CheckboxGroupIndicatorProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator>;

type CheckboxGroupProps = ComponentPropsWithoutRef<'div'> & { invalid?: boolean };

type CheckboxGroupComponent = FC<CheckboxGroupProps> & {
  Item: FC<CheckboxGroupItemProps>;
  Indicator: FC<CheckboxGroupIndicatorProps>;
};

/** The group's invalid state, for its checkboxes: aria-invalid belongs on each checkbox, not on role="group". */
const InvalidContext = createContext(false);

const Item: FC<CheckboxGroupItemProps> = ({ ref, className, children, ...props }) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-slot="checkbox-group-item"
    aria-invalid={use(InvalidContext) || undefined}
    className={cn(
      // A plain inline choice (control + label), never a field-like box; min-h keeps a 28px target (WCAG 2.5.8).
      'group/checkbox-item text-fg min-h-control-sm inline-flex cursor-pointer items-center gap-2 rounded-sm text-start text-sm',
      'focus-ring disabled:pointer-events-none disabled:opacity-50',
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

const CheckboxGroup: CheckboxGroupComponent = ({ className, invalid, children, ...props }) => (
  <div
    role="group"
    data-slot="checkbox-group"
    data-invalid={invalid || undefined}
    className={cn('grid w-full gap-3', className)}
    {...props}
  >
    <InvalidContext value={!!invalid}>{children}</InvalidContext>
  </div>
);

CheckboxGroup.Item = Item;
CheckboxGroup.Indicator = Indicator;

CheckboxGroup.Item.displayName = 'CheckboxGroupItem';
Indicator.displayName = 'CheckboxGroupIndicator';
CheckboxGroup.displayName = 'CheckboxGroup';

export default CheckboxGroup;
