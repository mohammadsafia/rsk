'use client';

import { type FC, type HTMLAttributes, type ReactNode } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type TitleProps = HTMLAttributes<HTMLHeadingElement>;

type DescriptionProps = HTMLAttributes<HTMLDivElement>;

type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    children: ReactNode;
  };

type AlertComponent = FC<AlertProps> & {
  Title: FC<TitleProps>;
  Description: FC<DescriptionProps>;
};

const alertVariants = cva(
  [
    'grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 rounded-lg border p-3 text-sm',
    // Fades in when it appears.
    'animate-in fade-in-0 duration-base ease-out motion-reduce:animate-none',
    '[&>svg]:mt-0.5 [&>svg]:size-4 *:data-[slot=alert-description]:col-start-2 *:data-[slot=alert-title]:col-start-2',
  ],
  {
    variants: {
      variant: {
        soft: '',
        outline: 'bg-surface border-border',
      },
      tone: {
        neutral: '',
        info: '',
        success: '',
        warning: '',
        danger: '',
      },
    },
    compoundVariants: [
      { variant: 'soft', tone: 'neutral', className: 'bg-surface-sunken border-border [&>svg]:text-fg-muted' },
      { variant: 'soft', tone: 'info', className: 'bg-info-subtle border-info/30 [&>svg]:text-info' },
      { variant: 'soft', tone: 'success', className: 'bg-success-subtle border-success/30 [&>svg]:text-success' },
      { variant: 'soft', tone: 'warning', className: 'bg-warning-subtle border-warning/30 [&>svg]:text-warning' },
      { variant: 'soft', tone: 'danger', className: 'bg-danger-subtle border-danger/30 [&>svg]:text-danger' },
      { variant: 'outline', tone: 'neutral', className: '[&>svg]:text-fg-muted' },
      { variant: 'outline', tone: 'info', className: '[&>svg]:text-info' },
      { variant: 'outline', tone: 'success', className: '[&>svg]:text-success' },
      { variant: 'outline', tone: 'warning', className: '[&>svg]:text-warning' },
      { variant: 'outline', tone: 'danger', className: '[&>svg]:text-danger' },
    ],
    defaultVariants: {
      variant: 'soft',
      tone: 'neutral',
    },
  },
);

const Title: FC<TitleProps> = ({ className, children, ...props }) => (
  <h5 data-slot="alert-title" className={cn('text-fg leading-snug font-semibold', className)} {...props}>
    {children}
  </h5>
);

const Description: FC<DescriptionProps> = ({ className, ...props }) => (
  <div data-slot="alert-description" className={cn('text-fg-muted [&_p]:leading-relaxed', className)} {...props} />
);

const Alert: AlertComponent = ({ className, variant, tone, ...props }) => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    data-slot="alert"
    data-variant={variant ?? 'soft'}
    data-tone={tone ?? 'neutral'}
    className={cn(alertVariants({ variant, tone }), className)}
    {...props}
  />
);

Alert.Title = Title;
Alert.Description = Description;

export default Alert;
