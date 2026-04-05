import { LoadingButton, type LoadingButtonProps } from '@components/shared';

import { cn } from '@utils';

type FormSubmitButton = LoadingButtonProps & {
  textContent?: string;
};

function FormSubmitButton({ className, size = 'default', textContent = 'Save', variant = 'default', ...props }: FormSubmitButton) {
  return (
    <LoadingButton className={cn('block w-fit', className)} variant={variant} size={size} type="submit" {...props}>
      {textContent}
    </LoadingButton>
  );
}

export default FormSubmitButton;
