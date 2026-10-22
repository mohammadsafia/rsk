'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { type FieldValues, FormProvider, type SubmitHandler, type UseFormReturn } from 'react-hook-form';

import FormContainerActions from './FormContainerActions';

export type FormContainerProps<TFieldValues extends FieldValues = FieldValues> = Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> & {
  formContext: UseFormReturn<TFieldValues>;
  onSuccess: SubmitHandler<TFieldValues>;
};

function FormContainer<TFieldValues extends FieldValues = FieldValues>({
  children,
  formContext,
  onSuccess,
  ...props
}: FormContainerProps<TFieldValues>) {
  return (
    <FormProvider<TFieldValues> {...formContext}>
      <form data-slot="form-container" autoComplete="new-password" noValidate {...props} onSubmit={formContext.handleSubmit(onSuccess)}>
        {children}
      </form>
    </FormProvider>
  );
}

FormContainer.Actions = FormContainerActions;

export default FormContainer;
