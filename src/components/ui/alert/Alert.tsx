import { type FC, type HTMLAttributes, type ReactElement } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@utils';

type TitleProps = HTMLAttributes<HTMLHeadingElement>;

type DescriptionProps = HTMLAttributes<HTMLParagraphElement>;

type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    children: Array<ReactElement<TitleProps, FC<TitleProps>> | ReactElement<DescriptionProps, FC<DescriptionProps>>>;
  };

type AlertComponent = FC<AlertProps> & {
  Title: FC<TitleProps>;
  Description: FC<DescriptionProps>;
};

const alertVariants = cva(
  `
  grid w-full grid-cols-[auto_1fr] items-center gap-y-1 rounded-lg p-4
  has-[>svg]:gap-x-3 *:data-[slot=alert-title]:col-start-2 *:data-[slot=alert-description]:col-start-2 [&:has(>[data-slot=alert-description])>svg]:row-span-2
  `,
  {
    variants: {
      variant: {
        default: 'bg-muted-50 text-muted-foreground border border-muted-200 [&>svg]:text-muted-foreground',
        info: 'bg-primary-15 text-primary border border-primary-25 [&>svg]:text-primary',
        destructive: 'bg-destructive-200 text-destructive border border-destructive-300 [&>svg]:text-destructive',
        warning: 'bg-warning-200 text-warning border border-warning-300 [&>svg]:text-warning',
        success: 'bg-success-200 text-success border border-success-300 [&>svg]:text-success',
        outline: 'border border-primary-400 text-primary [&>svg]:text-primary',
        'outline-info': 'border border-muted-400 bg-background text-foreground [&>svg]:text-foreground',
        'outline-destructive': 'border border-destructive-400 text-destructive [&>svg]:text-destructive',
        'outline-success': 'border border-success-400 text-success [&>svg]:text-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Title({ className, ...props }: TitleProps) {
  return <h5 data-slot="alert-title" className={cn('mb-0.5 leading-none font-medium tracking-tight', className)} {...props} />;
}

function Description({ className, ...props }: DescriptionProps) {
  return <div data-slot="alert-description" className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

const Alert: AlertComponent = ({ className, variant, ...props }) => (
  <div role="alert" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);

Alert.Title = Title;
Alert.Description = Description;

export default Alert;
