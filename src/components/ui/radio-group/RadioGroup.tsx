'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@utils';

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item>;

type RadioGroupIndicatorProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Indicator>;

type RadioGroupDotProps = {
  checked?: boolean;
  className?: string;
};

type RadioGroupProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & { invalid?: boolean };

type RadioGroupComponent = FC<RadioGroupProps> & {
  Item: FC<RadioGroupItemProps>;
  Indicator: FC<RadioGroupIndicatorProps>;
  Dot: FC<RadioGroupDotProps>;
};

/** The 16px radio circle; `data-state="checked"` draws the ring and grows the dot. */
const radioCircleClassName = [
  'border-border-strong bg-surface flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
  'after:size-2 after:rounded-full data-[state=checked]:border-fg data-[state=checked]:after:bg-fg',
  // The dot grows in on the spring when chosen.
  'after:scale-0 after:transition-[scale] after:duration-fast after:ease-spring data-[state=checked]:after:scale-100 motion-reduce:after:transition-none',
  'in-aria-invalid:border-danger',
].join(' ');

const Item: FC<RadioGroupItemProps> = ({ ref, className, children, ...props }) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    data-slot="radio-group-item"
    className={cn(
      // A plain inline choice (control + label), never a field-like box; min-h keeps a 28px target (WCAG 2.5.8).
      'group/radio-item text-fg min-h-control-sm inline-flex cursor-pointer items-center gap-2 rounded-sm text-start text-sm',
      'focus-ring disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
  </RadioGroupPrimitive.Item>
);

const Indicator = ({ className, children, ...props }: RadioGroupIndicatorProps) => (
  <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className={cn(radioCircleClassName, className)} forceMount {...props}>
    {children}
  </RadioGroupPrimitive.Indicator>
);

/** Non-interactive radio visual for custom single-select lists (e.g. table filters). */
const Dot: FC<RadioGroupDotProps> = ({ checked = false, className }) => (
  <span
    data-slot="radio-group-dot"
    data-state={checked ? 'checked' : 'unchecked'}
    aria-hidden="true"
    className={cn(radioCircleClassName, className)}
  />
);

const RadioGroup: RadioGroupComponent = ({ className, invalid, ...props }) => (
  <RadioGroupPrimitive.Root
    data-slot="radio-group"
    aria-invalid={invalid || undefined}
    className={cn('grid w-full gap-3', className)}
    {...props}
  />
);

RadioGroup.Item = Item;
RadioGroup.Indicator = Indicator;
RadioGroup.Dot = Dot;

RadioGroup.displayName = 'RadioGroup';
RadioGroup.Item.displayName = 'RadioGroupItem';
Indicator.displayName = 'RadioGroupIndicator';
Dot.displayName = 'RadioGroupDot';

export default RadioGroup;
