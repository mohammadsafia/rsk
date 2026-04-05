import { type FC, forwardRef } from 'react';

import { Tooltip } from '@components/ui';
import { LoadingButton, type LoadingButtonProps } from '@components/shared';

import { cn } from '@utils';

export type TooltipButtonProps = LoadingButtonProps;

const TooltipButton: FC<TooltipButtonProps> = ({ ref, title, className, children, ...props }) => {
  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <LoadingButton ref={ref} className={cn('', className)} {...props}>
            {children}
          </LoadingButton>
        </Tooltip.Trigger>

        <Tooltip.Content hidden={!title}>{title}</Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, TooltipButtonProps>((props, ref) => TooltipButton({ ...props, ref }));
