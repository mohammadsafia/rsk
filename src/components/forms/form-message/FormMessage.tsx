import { type HTMLAttributes } from 'react';
import { type FieldError } from 'react-hook-form';

import { Conditional } from '@components/utils';
import { ErrorTooltip } from '@components/shared';

import { cn } from '@utils';

type FormMessageProps = HTMLAttributes<HTMLParagraphElement> & {
  error: FieldError;
  errorType?: 'inline' | 'tooltip';
};

const FormMessage = ({ className, errorType = 'tooltip', children, ...props }: FormMessageProps) => {
  const body = props.error ? String(props.error?.message) : children;

  if (!body) return null;

  return (
    <Conditional>
      <Conditional.If condition={errorType === 'inline'}>
        <p className={cn('text-destructive text-sm', className)} {...props}>
          {body}
        </p>
      </Conditional.If>

      <Conditional.Else>
        <ErrorTooltip message={body} className={className} />
      </Conditional.Else>
    </Conditional>
  );
};

export default FormMessage;
