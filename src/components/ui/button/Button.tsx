import { type ComponentProps, type FC, forwardRef } from 'react';

import { Slot } from '@radix-ui/react-slot';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn, FOCUS_RING, TRANSITION_DEFAULT } from '@utils';

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = ComponentProps<'button'> &
  ButtonVariants & {
    asChild?: boolean;
  };

export const buttonVariants = cva(
  `
    inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background
    ${TRANSITION_DEFAULT} ${FOCUS_RING} cursor-pointer
    disabled:pointer-events-none disabled:opacity-50
    aria-disabled:pointer-events-none aria-disabled:opacity-50
  `,
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:not-disabled:bg-primary-600',
        secondary: 'bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary-600',
        muted: 'bg-muted-400 text-muted-foreground hover:not-disabled:bg-muted',
        destructive: 'text-destructive-foreground bg-destructive hover:not-disabled:bg-destructive/80',
        success: 'bg-success text-success-foreground hover:not-disabled:bg-success/80',
        link: 'text-primary underline-offset-4 hover:not-disabled:underline',
        icon: 'bg-primary-600 text-primary-foreground hover:not-disabled:bg-primary',
        ghost: 'text-foreground hover:not-disabled:text-primary',
        'ghost-muted': 'text-foreground hover:not-disabled:text-primary hover:not-disabled:bg-muted-200',
        'ghost-destructive': 'text-foreground hover:not-disabled:text-destructive',
        'ghost-muted-primary': 'text-muted-400 hover:not-disabled:text-primary-900',
        'ghost-muted-destructive': 'text-muted-400 hover:not-disabled:text-destructive',
        outline:
          'border border-primary-400 text-primary-400 bg-background shadow-xs hover:not-disabled:border-primary-600 hover:not-disabled:text-primary-600',
        'outline-destructive': 'border border-destructive text-destructive bg-destructive-200 hover:not-disabled:bg-destructive-200/80',
        'outline-success': 'border border-success text-success bg-success-200 hover:not-disabled:bg-success-200/80',
        unstyled: '',
      },
      size: {
        default: 'px-3 py-2',
        sm: 'rounded-md px-3 py-1',
        lg: 'rounded-md px-8 py-2.5',
        icon: 'h-8 w-8 rounded-full',
        'icon-sm': 'p-1.5 rounded',
        full: 'w-full px-4 py-2',
        unstyled: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button: FC<ButtonProps> = ({ ref, className, variant, size, asChild = false, ...props }) => {
  const Btn = asChild ? Slot : 'button';

  return (
    <Btn
      ref={ref}
      data-slot="button"
      aria-disabled={props.disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => Button({ ...props, ref }));
