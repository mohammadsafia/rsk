import { type HTMLAttributes, type ReactNode } from 'react';
import { Tooltip } from '@components/ui';

import { cn } from '@utils';

import { InfoIcon } from 'lucide-react';

type ErrorTooltipProps = HTMLAttributes<HTMLButtonElement> & {
  message: ReactNode;
};

function ErrorTooltip({ className, message, ...props }: ErrorTooltipProps) {
  return (
    <Tooltip content={<p>{message}</p>} className="bg-danger text-danger-fg text-sm">
      <button
        type="button"
        aria-label={typeof message === 'string' ? message : undefined}
        className={cn(
          'bg-danger text-danger-fg absolute inset-s-2 inset-bs-1/2 z-10 mb-0 flex -translate-y-1/2 cursor-help items-center justify-center rounded-full',
          className,
        )}
        {...props}
      >
        <InfoIcon size={20} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

export default ErrorTooltip;
