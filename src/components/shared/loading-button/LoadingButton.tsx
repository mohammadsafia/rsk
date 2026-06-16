import { type FC, forwardRef } from 'react';

import { Button, type ButtonProps } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Loader2Icon } from 'lucide-react';

export type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
};

const LoadingButton: FC<LoadingButtonProps> = ({ ref, className, loading = false, disabled, children, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <Button className={cn('gap relative', className)} disabled={disabled ?? loading} ref={ref} {...props}>
      <div role="button">
        <span className={cn(loading ? 'opacity-0' : 'opacity-100', className)}>{children}</span>

        <Conditional.If condition={loading}>
          <div className="absolute inset-s-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Loader2Icon className="animate-spin text-inherit" size={20} aria-label={t('loading')} />
          </div>
        </Conditional.If>
      </div>
    </Button>
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, LoadingButtonProps>((props, ref) => LoadingButton({ ...props, ref }));
