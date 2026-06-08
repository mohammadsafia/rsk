import { Children, type ComponentPropsWithoutRef, type FC, isValidElement, type ReactNode } from 'react';

import { Card } from '@components/ui';
import { PrimeTooltip, type PrimeTooltipProps } from '@components/shared';
import { Conditional } from '@components/utils';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Info } from 'lucide-react';

type PrimeCardHeaderProps = ComponentPropsWithoutRef<typeof Card.Header>;
type PrimeCardHeaderLeadingProps = ComponentPropsWithoutRef<'div'>;
type PrimeCardTitleProps = ComponentPropsWithoutRef<typeof Card.Title>;
type PrimeCardTooltipProps = PrimeTooltipProps;
type PrimeCardDescriptionProps = ComponentPropsWithoutRef<typeof Card.Description>;

type PrimeCardContentProps = ComponentPropsWithoutRef<typeof Card.Content>;

type PrimeCardProps = ComponentPropsWithoutRef<typeof Card> &
  VariantProps<typeof primeCardVariants> & {
    title?: ReactNode;
    tooltip?: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    children: ReactNode | ReactNode[];
  };

type CardComponent = FC<PrimeCardProps> & {
  Header: FC<PrimeCardHeaderProps>;
  Leading: FC<PrimeCardHeaderLeadingProps>;
  Title: FC<PrimeCardTitleProps>;
  Tooltip: FC<PrimeCardTooltipProps>;
  Description: FC<PrimeCardDescriptionProps>;
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
      outline: 'border-2 border-primary bg-transparent transition-colors hover:bg-primary-600 hover:text-primary-foreground dark:hover:bg-primary-300',
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

const PrimeCardHeader: FC<PrimeCardHeaderProps> = ({ className, ...props }) => (
  <Card.Header className={cn('bg-background border-primary-25 rounded-ss-[inherit] rounded-se-[inherit] border-b', className)} {...props} />
);

const PrimeCardHeaderLeading: FC<PrimeCardHeaderLeadingProps> = ({ className, children, ...props }) => (
  <div
    data-slot="prime-card-header-leading"
    className={cn('grid grid-cols-[auto_1fr] items-center gap-x-2', '*:data-[slot=card-description]:col-start-2', className)}
    {...props}
  >
    {children}
  </div>
);

const PrimeCardTitle: FC<PrimeCardHeaderProps> = ({ className, ...props }) => (
  <Card.Title className={cn('flex items-center gap-2', className)} {...props} />
);

const PrimeCardTooltip: FC<PrimeCardTooltipProps> = ({ className, children, ...props }) => {
  return (
    <PrimeTooltip align="start" {...props}>
      <PrimeTooltip.Trigger type="button">
        <Info size={20} className="text-muted-400 inline-block cursor-help" />
      </PrimeTooltip.Trigger>

      <PrimeTooltip.Item>{children}</PrimeTooltip.Item>
    </PrimeTooltip>
  );
};

const PrimeCardDescription: FC<PrimeCardDescriptionProps> = ({ className, ...props }) => (
  <Card.Description className={cn(className)} {...props} />
);

const PrimeCardContent: FC<PrimeCardContentProps> = ({ className, ...props }) => <Card.Content className={cn(className)} {...props} />;

const PrimeCard: CardComponent = ({ className, variant, title, icon, tooltip, description, children, ...props }) => {
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
            <PrimeCardHeaderLeading className={cn(!icon && 'contents')}>
              <Conditional.If condition={!!icon}>
                <span className="text-primary-900">{icon}</span>
              </Conditional.If>

              <PrimeCardTitle>
                {title}

                <Conditional.If condition={!!tooltip}>
                  <PrimeCardTooltip>{tooltip}</PrimeCardTooltip>
                </Conditional.If>
              </PrimeCardTitle>

              <Conditional.If condition={!!description}>
                <PrimeCardDescription>{description}</PrimeCardDescription>
              </Conditional.If>
            </PrimeCardHeaderLeading>
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
PrimeCard.Leading = PrimeCardHeaderLeading;
PrimeCard.Title = PrimeCardTitle;
PrimeCard.Tooltip = PrimeCardTooltip;
PrimeCard.Description = PrimeCardDescription;
PrimeCard.Content = PrimeCardContent;

export default PrimeCard;
