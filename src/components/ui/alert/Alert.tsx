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
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:-translate-y-0.75 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Title({ className, ...props }: TitleProps) {
  return <h5 data-slot="alert-title" className={cn('mb-1 leading-none font-medium tracking-tight', className)} {...props} />;
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
