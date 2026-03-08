import { Tooltip } from '@components/ui';
import { LoadingButton, type LoadingButtonProps } from '@components/shared';

import { cn } from '@utils';

export type TooltipButtonProps = LoadingButtonProps;

const TooltipButton = ({ title, className, children, ...props }: TooltipButtonProps) => {
  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <LoadingButton className={cn('', className)} {...props}>
            {children}
          </LoadingButton>
        </Tooltip.Trigger>

        <Tooltip.Content hidden={!title}>{title}</Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};

export default TooltipButton;
