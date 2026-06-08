import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { type FieldError } from 'react-hook-form';
import * as LabelPrimitive from '@radix-ui/react-label';

import { PrimeTooltip } from '@components/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Asterisk, Info } from 'lucide-react';

type FormLabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & {
    error?: FieldError;
    required?: boolean;
    tooltip?: ReactNode;
    hidden?: boolean;
  };

const labelVariants = cva(
  'text-muted-foreground inline-block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
);

const FormLabel: FC<FormLabelProps> = ({ className, error, children, tooltip, required, hidden, ...props }) => {
  if (hidden) return null;

  return (
    <LabelPrimitive.Root data-slot="form-label" className={cn(labelVariants(), error && 'text-destructive', className)} {...props}>
      {children}

      {required && <Asterisk className="ms-0.5 inline-block align-text-top text-inherit" size={10} />}

      {tooltip && (
        <PrimeTooltip align="start">
          <PrimeTooltip.Trigger type="button">
            <Info size={16} className="text-muted-400 ms-1 inline-block cursor-help" />
          </PrimeTooltip.Trigger>

          <PrimeTooltip.Item onClick={(e) => e.preventDefault()}>{tooltip}</PrimeTooltip.Item>
        </PrimeTooltip>
      )}
    </LabelPrimitive.Root>
  );
};

FormLabel.displayName = 'FormLabel';

export default FormLabel;
