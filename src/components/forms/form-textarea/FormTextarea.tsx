import { type TextareaHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { cn } from '@utils';

import type { FieldBaseProps } from '@app-types';

type FormTextareaProps<TFieldValues extends FieldValues> = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBaseProps<TFieldValues>;

function FormTextarea<TFieldValues extends FieldValues>({
  name,
  label,
  tooltip,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  required,
  rules,
  ...props
}: FormTextareaProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const { fieldState } = useController<TFieldValues>({ name });

  const { error } = fieldState;
  const id = `${name}-${useId()}`;

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} htmlFor={id} tooltip={tooltip} required={required} hidden={!label} error={error!}>
        {label}
      </FormLabel>

      <div className="relative">
        <textarea
          id={id}
          data-slot="textarea"
          className={cn(
            'border-muted-200 bg-background flex field-sizing-content w-full resize-y rounded-md border p-3 text-sm shadow-xs transition-[color,box-shadow] outline-none',
            'placeholder:text-muted-foreground',
            'hover:not-disabled:border-primary hover:not-disabled:ring-primary hover:not-disabled:ring',
            'focus-visible:ring-primary focus-visible:border-primary focus-visible:ring',
            'disabled:bg-muted-50 disabled:text-muted-300 disabled:placeholder:text-muted-300 disabled:pointer-events-none disabled:field-sizing-fixed',
            error &&
              'border-destructive hover:not-disabled:border-destructive hover:not-disabled:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive placeholder:text-destructive ps-8',
            className,
          )}
          {...register(name, rules)}
          {...props}
        />

        <FormMessage className={cn('inset-bs-6', errorClassName)} hidden={!error} error={error!} />
      </div>
    </FormControl>
  );
}

export default FormTextarea;
