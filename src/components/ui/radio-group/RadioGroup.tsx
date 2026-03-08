import { type ComponentPropsWithoutRef, type FC, type ReactNode, type RefCallback } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@utils';

type RadioGroupComponent = FC<ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>> & {
  Item: FC<RadioGroupItemProps>;
  Indicator: FC<RadioGroupIndicatorProps>;
};

type RadioGroupItemProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  ref?: RefCallback<HTMLButtonElement>;
  children: ReactNode;
};

type RadioGroupIndicatorProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Indicator> & {
  children: ReactNode;
};

const RadioGroup: RadioGroupComponent = ({ className, ...props }) => (
  <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid w-full gap-2', className)} {...props} />
);

const Item = ({ ref, className, children, ...props }: RadioGroupItemProps) => (
  <RadioGroupPrimitive.Item
    ref={(el) => ref?.(el)}
    data-slot="radio-group-item"
    className={cn(
      'group/radio-item border-muted-200 bg-surface-500 flex h-[42px] w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 outline-none',
      'data-[state=checked]:border-muted-200 data-[state=checked]:bg-secondary-100',
      'focus-visible:ring-ring focus-visible:ring-2',
      'disabled:bg-muted-50 disabled:cursor-not-allowed disabled:opacity-70',
      'disabled:data-[state=checked]:bg-muted-50 disabled:data-[state=checked]:border-muted-200',
      className,
    )}
    {...props}
  >
    {children}
  </RadioGroupPrimitive.Item>
);

const Indicator = ({ className, children, ...props }: RadioGroupIndicatorProps) => (
  <RadioGroupPrimitive.Indicator
    data-slot="radio-group-indicator"
    className={cn('flex shrink-0 items-center justify-center', className)}
    forceMount
    {...props}
  >
    {children}
  </RadioGroupPrimitive.Indicator>
);

RadioGroup.Item = Item;
RadioGroup.Indicator = Indicator;

Item.displayName = 'RadioGroupItem';
Indicator.displayName = 'RadioGroupIndicator';
RadioGroup.displayName = 'RadioGroup';

export default RadioGroup;
