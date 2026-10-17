import { type ComponentProps, type ComponentPropsWithoutRef, type FC, forwardRef } from 'react';

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

/** The 16px radio circle; `data-state="checked"` draws the accent ring and dot. */
const radioCircleClassName = [
  'border-border-strong bg-surface flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
  'after:size-2 after:rounded-full data-[state=checked]:border-accent data-[state=checked]:after:bg-accent',
  'in-aria-invalid:border-danger',
].join(' ');

const Item: FC<RadioGroupItemProps> = ({ ref, className, children, ...props }) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    data-slot="radio-group-item"
    className={cn(
      'group/radio-item border-border bg-surface text-fg flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
      'focus-ring hover:not-disabled:border-border-strong',
      'data-[state=checked]:border-accent data-[state=checked]:bg-accent-subtle',
      'in-aria-invalid:border-danger',
      'disabled:pointer-events-none disabled:opacity-50',
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

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
RadioGroup.Item = forwardRef<HTMLButtonElement, RadioGroupItemProps>((props, ref) => Item({ ...props, ref }));
RadioGroup.Indicator = Indicator;
RadioGroup.Dot = Dot;

RadioGroup.displayName = 'RadioGroup';
RadioGroup.Item.displayName = 'RadioGroupItem';
Indicator.displayName = 'RadioGroupIndicator';
Dot.displayName = 'RadioGroupDot';

export default RadioGroup;
