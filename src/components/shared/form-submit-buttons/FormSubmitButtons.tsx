import type { PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@components/ui';
import { Conditional } from '@components/utils';
import { FormSubmitButton } from '@components/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type FormSubmitBtnsVariants = VariantProps<typeof formSubmitBtnsVariants>;

type FormActionButtonsProps = FormSubmitBtnsVariants &
  PropsWithChildren<{
    defaultPrimaryText?: string;
    defaultPrimaryLoading?: boolean;
    defaultPrimaryCreateUpdate?: boolean;
    className?: string;
  }>;

const formSubmitBtnsVariants = cva('', {
  variants: {
    align: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    align: 'end',
  },
});

function FormSubmitButtons({ align, className, ...props }: FormActionButtonsProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'bg-background shadow-boundary-ghost sticky bottom-2.5 z-10 flex gap-1 rounded-md p-2',
        formSubmitBtnsVariants({ align }),
        className,
      )}
    >
      <Button size="lg" variant="muted" type="reset" onClick={() => navigate(-1)}>
        Cancel
      </Button>

      <Conditional>
        <Conditional.If condition={!!props.children}>{props.children}</Conditional.If>

        <Conditional.Else>
          <FormSubmitButton
            className="lg:ms-0"
            size="lg"
            loading={props.defaultPrimaryLoading}
            textContent={props.defaultPrimaryText || (props.defaultPrimaryCreateUpdate ? 'Update' : 'Create')}
          />
        </Conditional.Else>
      </Conditional>
    </div>
  );
}

export default FormSubmitButtons;
