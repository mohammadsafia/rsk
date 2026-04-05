import { type HTMLAttributes, type ReactNode } from 'react';
import { Tooltip } from '@components/ui';

import { cn } from '@utils';

import { InfoIcon } from 'lucide-react';

type ErrorTooltipProps = HTMLAttributes<HTMLButtonElement> & {
  message: ReactNode;
};

function ErrorTooltip({ className, message, ...props }: ErrorTooltipProps) {
  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger
          className={cn(
            'bg-destructive text-destructive-foreground absolute inset-s-2 inset-bs-1/2 z-10 mb-0 flex -translate-y-1/2 cursor-help items-center justify-center rounded-full',
            className,
          )}
          asChild
          {...props}
        >
          <InfoIcon size={20} />
        </Tooltip.Trigger>

        <Tooltip.Content className="bg-destructive text-destructive-foreground text-sm">
          <p>{message}</p>
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
}

export default ErrorTooltip;
