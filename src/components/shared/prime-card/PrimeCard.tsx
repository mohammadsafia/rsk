import { Children, type ComponentProps, type FC, isValidElement, type ReactNode } from 'react';

import { Card } from '@components/ui';
import { Conditional } from '@components/utils';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type PrimeCardHeaderProps = ComponentProps<typeof Card.Header>;

type PrimeCardTitleProps = ComponentProps<typeof Card.Title>;

type PrimeCardContentProps = ComponentProps<typeof Card.Content>;

type PrimeCardProps = ComponentProps<typeof Card> &
  VariantProps<typeof primeCardVariants> & {
    title?: ReactNode;
    icon?: ReactNode;
    children: ReactNode | ReactNode[];
  };

type CardComponent = FC<PrimeCardProps> & {
  Header: FC<PrimeCardHeaderProps>;
  Title: FC<PrimeCardTitleProps>;
  Content: FC<PrimeCardContentProps>;
};

const primeCardVariants = cva('', {
  variants: {
    variant: {
      default: '',
      primary: 'bg-primary-15',
      secondary: 'bg-secondary-15',
      success: 'bg-success-200',
      destructive: 'bg-destructive-200',
      warning: 'bg-warning-200',
      info: 'bg-accent-200',
      outline: 'border-2 border-primary bg-transparent transition-colors hover:bg-primary-600 hover:text-primary-foreground',
      'outline-secondary':
        'border-2 border-secondary bg-transparent transition-colors hover:bg-secondary-600 hover:text-secondary-foreground',
      glass: 'backdrop-blur-sm bg-background/10',
      gradient: 'bg-linear-to-br from-primary-25 to-secondary-25',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const PrimeCardHeader: FC<PrimeCardHeaderProps> = ({ children, className, ...props }) => (
  <Card.Header className={cn('bg-background border-primary-25 rounded-ss-[inherit] rounded-se-[inherit] border-b', className)} {...props}>
    {children}
  </Card.Header>
);

const PrimeCardTitle: FC<PrimeCardHeaderProps> = ({ children, className, ...props }) => (
  <Card.Title className={cn('flex items-center gap-3', className)} {...props}>
    {children}
  </Card.Title>
);

const PrimeCardContent: FC<PrimeCardContentProps> = ({ children, className, ...props }) => (
  <Card.Content className={cn('', className)} {...props}>
    {children}
  </Card.Content>
);

const PrimeCard: CardComponent = ({ className, variant, title, icon, children, ...props }) => {
  const childArray = Children.toArray(children);

  const headerChild = childArray.find((child) => isValidElement(child) && child.type === PrimeCardHeader);

  const contentChild = childArray.find((child) => isValidElement(child) && child.type === PrimeCardContent);

  const otherChildren = childArray.filter(
    (child) => !(isValidElement(child) && (child.type === PrimeCardHeader || child.type === PrimeCardContent)),
  );

  return (
    <Card className={cn(primeCardVariants({ variant }), className)} {...props}>
      <Conditional>
        <Conditional.If condition={!!headerChild}>{headerChild}</Conditional.If>

        <Conditional.Else>
          <PrimeCardHeader>
            <PrimeCardTitle>
              <Conditional.If condition={!!icon}>
                <span className="text-primary-900">{icon}</span>
              </Conditional.If>

              {title}
            </PrimeCardTitle>
          </PrimeCardHeader>
        </Conditional.Else>
      </Conditional>

      <Conditional>
        <Conditional.If condition={!!contentChild}>{contentChild}</Conditional.If>

        <Conditional.Else>
          <PrimeCardContent>{otherChildren}</PrimeCardContent>
        </Conditional.Else>
      </Conditional>
    </Card>
  );
};

PrimeCard.Header = PrimeCardHeader;
PrimeCard.Title = PrimeCardTitle;
PrimeCard.Content = PrimeCardContent;

export default PrimeCard;
