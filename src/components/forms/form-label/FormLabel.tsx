import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { type FieldError } from 'react-hook-form';
import * as LabelPrimitive from '@radix-ui/react-label';

import { Tooltip } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

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
  const { t } = useAppTranslation('common');

  if (hidden) return null;

  return (
    <LabelPrimitive.Root data-slot="form-label" className={cn(labelVariants(), error && 'text-destructive', className)} {...props}>
      {children}

      {required && <Asterisk className="ms-0.5 inline-block align-text-top text-inherit" size={10} />}

      {tooltip && (
        <Tooltip content={tooltip} align="start">
          <button
            type="button"
            aria-label={t('moreInfo')}
            className="focus-ring text-fg-muted ms-1 inline-flex cursor-help rounded-sm align-text-top"
            onClick={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
          >
            <Info size={16} aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </LabelPrimitive.Root>
  );
};

FormLabel.displayName = 'FormLabel';

export default FormLabel;
