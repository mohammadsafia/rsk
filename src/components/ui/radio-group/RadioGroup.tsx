import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@utils';

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
      'group/radio-item border-muted-200 bg-background flex cursor-pointer items-center gap-5 rounded-md border p-3 transition-[color,box-shadow]',
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
  </RadioGroupPrimitive.Item>
);

const Indicator = ({ className, children, ...props }: RadioGroupIndicatorProps) => (
  <RadioGroupPrimitive.Indicator
    data-slot="radio-group-indicator"
    className={cn(
      'border-muted-200 bg-background flex h-5 w-5 shrink-0 items-center justify-center rounded-full border -outline-offset-1 transition-[color,box-shadow] outline-none',
      'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary-300 dark:data-[state=checked]:border-primary-300',
      'group-hover/radio-item:border-primary group-hover/radio-item:ring-primary group-hover/radio-item:ring',
      'data-[state=checked]:group-hover/radio-item:border-primary data-[state=checked]:group-hover/radio-item:ring-primary',
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
