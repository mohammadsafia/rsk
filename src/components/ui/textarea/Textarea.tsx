'use client';

import { type ComponentProps, type FC } from 'react';

import { fieldVariants } from '@components/ui';

import { cn } from '@utils';

type TextareaProps = ComponentProps<'textarea'> & {
  invalid?: boolean;
};

/** Multi-line field on the shared field shape; grows with its content (field-sizing). */
const Textarea: FC<TextareaProps> = ({ ref, className, invalid, ...props }) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    aria-invalid={invalid || undefined}
    // size: null drops the fixed control height (tailwind-merge can't override the custom h-control-* class).
    className={cn(
      fieldVariants({ size: null }),
      'field-sizing-content min-h-20 resize-y items-start px-3 py-2 text-sm disabled:field-sizing-fixed',
      className,
    )}
    {...props}
  />
);

export default Textarea;
