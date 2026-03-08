import { type ComponentPropsWithoutRef, type FC } from 'react';
import { type FieldError } from 'react-hook-form';
import * as LabelPrimitive from '@radix-ui/react-label';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Asterisk } from 'lucide-react';

const labelVariants = cva(
  'text-muted inline-block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

type FormLabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & {
    error?: FieldError;
    required?: boolean;
    hidden?: boolean;
  };

const FormLabel: FC<FormLabelProps> = ({ className, error, children, required, hidden, id, ...props }) => {
  if (hidden) return null;

  return (
    <LabelPrimitive.Root
      htmlFor={id}
      data-slot="form-label"
      className={cn(labelVariants(), { 'text-destructive': !!error }, className)}
      {...props}
    >
      {children}

      {required && <Asterisk className="ml-0.5 inline-block align-text-top text-inherit" size={10} />}
    </LabelPrimitive.Root>
  );
};

FormLabel.displayName = 'FormLabel';

export default FormLabel;
