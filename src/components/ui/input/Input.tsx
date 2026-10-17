import { type ComponentProps, type FC, forwardRef } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

/** The shared field shape: Input, Select trigger, TimePicker trigger, FormattedNumber (spec addendum §7). */
export const fieldVariants = cva(
  [
    'border-border-strong bg-surface text-fg flex w-full min-w-0 items-center rounded-md border transition-colors outline-none',
    'placeholder:text-fg-muted hover:not-disabled:not-aria-invalid:border-fg-muted',
    'focus-ring-input state-invalid',
    'disabled:border-border disabled:bg-surface-sunken disabled:text-fg-subtle disabled:pointer-events-none',
  ],
  {
    variants: {
      size: {
        sm: 'h-control-sm px-2.5 text-xs',
        md: 'h-control-md px-3 text-sm',
        lg: 'h-control-lg px-3 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type FieldVariants = VariantProps<typeof fieldVariants>;

type InputProps = Omit<ComponentProps<'input'>, 'size'> &
  FieldVariants & {
    invalid?: boolean;
  };

const Input: FC<InputProps> = ({ ref, className, size, invalid, ...props }) => (
  <input
    ref={ref}
    dir="auto"
    data-slot="input"
    aria-invalid={invalid || undefined}
    className={cn(fieldVariants({ size }), 'file:border-0 file:bg-transparent file:text-sm file:font-medium', className)}
    {...props}
  />
);

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLInputElement, InputProps>((props, ref) => Input({ ...props, ref }));
