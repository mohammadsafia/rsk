'use client';

import { type ComponentProps, type FC } from 'react';

import { cn } from '@utils';

import { type FieldVariants, fieldVariants } from './variants';

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

export default Input;
