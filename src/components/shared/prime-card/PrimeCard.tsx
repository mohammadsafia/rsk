import { Children, type ComponentPropsWithoutRef, type FC, isValidElement, type ReactNode } from 'react';

import { Card, Tooltip, type TooltipProps } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { Info } from 'lucide-react';

type PrimeCardHeaderProps = ComponentPropsWithoutRef<typeof Card.Header>;
type PrimeCardHeaderLeadingProps = ComponentPropsWithoutRef<'div'>;
type PrimeCardTitleProps = ComponentPropsWithoutRef<typeof Card.Title>;
type PrimeCardTooltipProps = Omit<TooltipProps, 'content' | 'children'> & { children: ReactNode };
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

// Tints cover the whole card so header and body read as one surface; text stays fg on every tint.
const primeCardVariants = cva('', {
  variants: {
    variant: {
      default: '',
      primary: 'bg-accent-subtle',
      secondary: 'bg-surface-sunken',
      success: 'bg-success-subtle',
      destructive: 'bg-danger-subtle',
      warning: 'bg-warning-subtle',
      info: 'bg-info-subtle',
      outline: 'border-border-strong',
      'outline-dashed': 'border-border-strong border-dashed',
      glass: 'bg-surface/80 backdrop-blur-sm',
      gradient: 'bg-linear-to-br from-surface to-accent-subtle',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const PrimeCardHeader: FC<PrimeCardHeaderProps> = ({ className, ...props }) => (
  <Card.Header className={cn('border-border-subtle border-b pb-3', className)} {...props} />
);

const PrimeCardHeaderLeading: FC<PrimeCardHeaderLeadingProps> = ({ className, children, ...props }) => (
  <div
    data-slot="prime-card-header-leading"
    className={cn('grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5', '*:data-[slot=card-description]:col-start-2', className)}
    {...props}
  >
    {children}
  </div>
);

const PrimeCardTitle: FC<PrimeCardHeaderProps> = ({ className, ...props }) => (
  <Card.Title className={cn('flex items-center gap-1.5', className)} {...props} />
);

const PrimeCardTooltip: FC<PrimeCardTooltipProps> = ({ children, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <Tooltip content={children} align="start" {...props}>
      <button
        type="button"
        aria-label={t('moreInfo')}
        className="focus-ring text-fg-muted inline-flex cursor-help rounded-sm"
        onClick={(event) => event.preventDefault()}
        onPointerDown={(event) => event.preventDefault()}
      >
        <Info size={16} aria-hidden="true" />
      </button>
    </Tooltip>
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
                <span className="text-fg-muted flex [&_svg]:size-4">{icon}</span>
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
