'use client';

import { type FC } from 'react';

import { Button, type ButtonProps, Tooltip } from '@components/ui';

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
    <Tooltip content={props['aria-label']} disabled={!tooltip}>
      {button}
    </Tooltip>
  );
};

export default IconButton;
