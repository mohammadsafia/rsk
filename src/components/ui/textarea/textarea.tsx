import * as React from 'react';
import { cn } from '@utils';

export type TextareaProps = React.ComponentProps<'textarea'> & {
  className?: string;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, id, ...props }, ref) => {
  return (
    <textarea
      id={id}
      data-slot="textarea"
      className={cn(
        'text-primary-900 placeholder:text-muted selection:bg-primary selection:text-primary-foreground',
        'border-muted-200 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-primary focus-visible:ring-primary focus-visible:ring-1',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export default Textarea;
