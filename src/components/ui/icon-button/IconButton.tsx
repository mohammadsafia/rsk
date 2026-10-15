import { type FC, forwardRef } from 'react';

import { Button, type ButtonProps, Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { cn } from '@utils';

export type IconButtonProps = Omit<ButtonProps, 'aria-label' | 'fullWidth'> & {
  'aria-label': string;
  tooltip?: boolean;
};

const SQUARE_SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-control-sm',
  md: 'w-control-md',
  lg: 'w-control-lg',
};

const IconButton: FC<IconButtonProps> = ({ ref, variant = 'ghost', size, tooltip = true, className, ...props }) => {
  const button = (
    <Button
      ref={ref}
      data-slot="icon-button"
      variant={variant}
      size={size}
      className={cn(SQUARE_SIZE[size ?? 'md'], 'px-0', className)}
      {...props}
    />
  );

  return (
    <Conditional>
      <Conditional.If condition={tooltip}>
        <Tooltip>
          <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>

          <Tooltip.Content>{props['aria-label']}</Tooltip.Content>
        </Tooltip>
      </Conditional.If>

      <Conditional.Else>{button}</Conditional.Else>
    </Conditional>
  );
};

// React 18 bridge — remove forwardRef wrapper when upgrading to React 19
export default forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => IconButton({ ...props, ref }));
