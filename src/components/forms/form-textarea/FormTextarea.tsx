import { type TextareaHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { Textarea } from '@components/ui';

import { cn } from '@utils';

import type { FieldBaseProps } from '@app-types';

type FormTextareaProps<TFieldValues extends FieldValues> = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBaseProps<TFieldValues>;

function FormTextarea<TFieldValues extends FieldValues>({
  name,
  label,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  required,
  ...props
}: FormTextareaProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const { fieldState } = useController<TFieldValues>({ name });

  const { error } = fieldState;
  const id = `${name}-${useId()}`;

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} error={error!} hidden={!label} htmlFor={id} required={required}>
        {label}
      </FormLabel>

      <div className="relative">
        <Textarea
          id={id}
          className={cn(
            {
              'border-destructive hover:ring-destructive focus-visible:ring-destructive ps-8': !!error,
            },
            className,
          )}
          {...register(name)}
          {...props}
        />
        <FormMessage className={cn('top-5', errorClassName)} hidden={!error} error={error!} />
      </div>
    </FormControl>
  );
}

export default FormTextarea;
