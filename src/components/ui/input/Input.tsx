import { type ComponentProps, type FC, forwardRef } from 'react';

import { cn, DISABLED_STYLES, FOCUS_RING, TRANSITION_DEFAULT } from '@utils';

type InputProps = ComponentProps<'input'>;

const Input: FC<InputProps> = ({ ref, className, ...props }) => (
  <input
    data-slot="input"
    ref={ref}
    className={cn(
      `border-muted-200 bg-muted-50 flex w-full rounded-md border p-3 text-sm shadow-xs ${TRANSITION_DEFAULT} ${FOCUS_RING}`,
      'placeholder:text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium',
      'hover:not-disabled:border-primary-200 hover:not-disabled:ring-primary/40 hover:not-disabled:ring',
      `disabled:bg-muted-50 disabled:text-muted-300 disabled:placeholder:text-muted-300 ${DISABLED_STYLES}`,
      className,
    )}
    {...props}
  />
);

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLInputElement, InputProps>((props, ref) => Input({ ...props, ref }));
