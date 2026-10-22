'use client';

import { type ComponentProps, type FC } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { Conditional } from '@components/utils';

import { cn } from '@utils';

import { Check, Minus } from 'lucide-react';

import { checkboxBoxClassName } from './styles';

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & { invalid?: boolean };

const Checkbox: FC<CheckboxProps> = ({ ref, className, checked, invalid, ...props }) => (
  <CheckboxPrimitive.Root
    ref={ref}
    aria-invalid={invalid || undefined}
    data-slot="checkbox"
    checked={checked}
    className={cn(checkboxBoxClassName, 'tactile focus-ring cursor-pointer disabled:pointer-events-none disabled:opacity-50', className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="draw-check flex items-center justify-center">
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

export default Checkbox;
