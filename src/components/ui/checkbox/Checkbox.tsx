import { type ComponentProps, type FC, forwardRef } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@utils';

import { Check } from 'lucide-react';

type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & VariantProps<typeof checkboxVariants>;

const checkboxVariants = cva(
  [
    'border-muted-200 bg-background h-5 w-5 shrink-0 rounded border transition-[color,box-shadow] outline-none',
    'hover:not-disabled:border-primary hover:not-disabled:ring-primary hover:not-disabled:ring',
    'disabled:data-[state=checked]:bg-muted-400 disabled:data-[state=checked]:border-muted-400 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        secondary: [
          'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background',
          'data-[state=checked]:hover:not-disabled:border-foreground data-[state=checked]:hover:not-disabled:ring-muted-400',
        ],
        primary: [
          'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:border-primary-300 dark:data-[state=checked]:bg-primary-300',
          'data-[state=checked]:hover:not-disabled:border-primary data-[state=checked]:hover:not-disabled:ring-primary',
        ],
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

const Checkbox: FC<CheckboxProps> = ({ ref, className, variant, ...props }) => (
  <CheckboxPrimitive.Root ref={ref} data-slot="checkbox" className={cn(checkboxVariants({ variant }), className)} {...props}>
    <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center text-inherit">
      <Check size={16} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

Checkbox.displayName = 'Checkbox';

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, CheckboxProps>((props, ref) => Checkbox({ ...props, ref }));
