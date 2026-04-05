import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn, FOCUS_RING } from '@utils';

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

type RadioGroupIndicatorProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Indicator>;

type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

type RadioGroupComponent = FC<RadioGroupProps> & {
  Item: FC<RadioGroupItemProps>;
  Indicator: FC<RadioGroupIndicatorProps>;
};

const Item: FC<RadioGroupItemProps> = ({ ref, className, children, ...props }) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    data-slot="radio-group-item"
    className={cn(
      'group/radio-item border-muted-200 bg-muted-50 flex cursor-pointer items-center gap-5 rounded-md border p-3 transition-[color,box-shadow]',
      'data-[state=checked]:border-secondary-200 data-[state=checked]:bg-secondary-100',
      `hover:border-primary-200 hover:ring-primary/40 ${FOCUS_RING} hover:ring`,
      'data-[state=checked]:hover:border-secondary-200 data-[state=checked]:hover:ring-secondary-200 data-[state=checked]:focus-visible:border-secondary-200 data-[state=checked]:focus-visible:ring-secondary-200',
      'disabled:bg-muted-50 disabled:text-muted-300 disabled:pointer-events-none',
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
    className={cn(
      'border-muted-200 bg-muted-50 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[color,box-shadow] outline-none',
      'data-[state=checked]:border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground',
      'group-hover/radio-item:border-primary-200 group-hover/radio-item:ring-primary/40 group-hover/radio-item:ring',
      'data-[state=checked]:group-hover/radio-item:border-secondary data-[state=checked]:group-hover/radio-item:ring-secondary',
      'group-disabled/radio-item:data-[state=checked]:bg-muted-400 group-disabled/radio-item:data-[state=checked]:border-muted-400',
      className,
    )}
    forceMount
    {...props}
  >
    {children}
  </RadioGroupPrimitive.Indicator>
);

const RadioGroup: RadioGroupComponent = ({ className, ...props }) => (
  <RadioGroupPrimitive.Root data-slot="radio-group" className={cn('grid w-full gap-3', className)} {...props} />
);

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
RadioGroup.Item = forwardRef<HTMLButtonElement, RadioGroupItemProps>((props, ref) => Item({ ...props, ref }));
RadioGroup.Indicator = Indicator;

RadioGroup.displayName = 'RadioGroup';
RadioGroup.Item.displayName = 'RadioGroupItem';
Indicator.displayName = 'RadioGroupIndicator';

export default RadioGroup;
