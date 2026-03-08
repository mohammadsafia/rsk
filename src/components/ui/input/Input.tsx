import * as React from 'react';
import { cn } from '@utils';

export type InputProps = React.ComponentProps<'input'> & {
  className?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, id, ...props }, ref) => {
  return (
    <input
      id={id}
      type={props.type ?? 'text'}
      data-slot="input"
      className={cn(
        'file:text-foreground text-primary-900 placeholder:text-muted selection:bg-primary selection:text-primary-foreground',
        'border-muted-200 bg-surface h-12 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export default Input;
