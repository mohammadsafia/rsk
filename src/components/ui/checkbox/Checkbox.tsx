import { type ComponentProps, type FC, forwardRef } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { Check, Minus } from 'lucide-react';

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & { invalid?: boolean };

/** The 16px checkbox square, shared with CheckboxGroup.Indicator. State comes from Radix `data-state`. */
export const checkboxBoxClassName = [
  'border-border-strong bg-surface text-accent-fg flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
  'data-[state=checked]:border-accent data-[state=checked]:bg-accent',
  'data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent',
  'aria-invalid:border-danger in-aria-invalid:border-danger',
].join(' ');

const Checkbox: FC<CheckboxProps> = ({ ref, className, checked, invalid, ...props }) => (
  <CheckboxPrimitive.Root
    ref={ref}
    aria-invalid={invalid || undefined}
    data-slot="checkbox"
    checked={checked}
    className={cn(checkboxBoxClassName, 'focus-ring cursor-pointer disabled:pointer-events-none disabled:opacity-50', className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center">
      <Conditional>
        <Conditional.If condition={checked === 'indeterminate'}>
          <Minus className="size-3" strokeWidth={3} />
        </Conditional.If>

        <Conditional.Else>
          <Check className="size-3" strokeWidth={3} />
        </Conditional.Else>
      </Conditional>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

Checkbox.displayName = 'Checkbox';

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, CheckboxProps>((props, ref) => Checkbox({ ...props, ref }));
