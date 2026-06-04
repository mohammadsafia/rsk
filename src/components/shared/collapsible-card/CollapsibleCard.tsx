import { type ComponentPropsWithoutRef, createContext, type FC, type SVGProps, useContext } from 'react';

import { Card, Collapsible } from '@components/ui';
import { PrimeTooltip, type PrimeTooltipProps } from '@components/shared';

import { cva, VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { ChevronDown, Info } from 'lucide-react';

type CollapsibleCardContextValue = VariantProps<typeof collapsibleCardVariants>;

type CollapsibleCardHeaderProps = ComponentPropsWithoutRef<typeof Card.Header> & VariantProps<typeof collapsibleCardHeaderVariants>;
type CollapsibleCardHeaderLeadingProps = ComponentPropsWithoutRef<'div'>;
type CollapsibleCardTitleProps = ComponentPropsWithoutRef<typeof Card.Title>;
type CollapsibleCardTriggerProps = ComponentPropsWithoutRef<typeof Collapsible.Trigger>;
type CollapsibleCardTriggerIconProps = SVGProps<SVGSVGElement>;
type CollapsibleCardTooltipProps = PrimeTooltipProps;
type CollapsibleCardDescriptionProps = ComponentPropsWithoutRef<typeof Card.Description>;
type CollapsibleCardContentProps = ComponentPropsWithoutRef<typeof Card.Content> & VariantProps<typeof collapsibleCardVariants>;
type CollapsibleCardFooterProps = ComponentPropsWithoutRef<typeof Card.Footer>;

type CollapsibleCardProps = ComponentPropsWithoutRef<typeof Card> &
  ComponentPropsWithoutRef<typeof Collapsible> &
  VariantProps<typeof collapsibleCardVariants>;

type CollapsibleCardComponent = FC<CollapsibleCardProps> & {
  Header: FC<CollapsibleCardHeaderProps>;
  Leading: FC<CollapsibleCardHeaderLeadingProps>;
  Title: FC<CollapsibleCardTitleProps>;
  Trigger: FC<CollapsibleCardTriggerProps>;
  TriggerIcon: FC<CollapsibleCardTriggerIconProps>;
  Tooltip: FC<CollapsibleCardTooltipProps>;
  Description: FC<CollapsibleCardDescriptionProps>;
  Content: FC<CollapsibleCardContentProps>;
  Footer: FC<CollapsibleCardFooterProps>;
};

const collapsibleCardHeaderVariants = cva('', {
  variants: {
    variant: {
      default: 'bg-background border-primary-25',
      primary: 'bg-background border-primary-25',
      secondary: 'bg-background border-primary-25',
      success: 'bg-background border-primary-25',
      destructive: 'bg-background border-primary-25',
      warning: 'bg-background border-primary-25',
      info: 'bg-background border-primary-25',
      outline: 'bg-background border-primary-25',
      'outline-secondary': 'bg-background border-primary-25',
      glass: 'bg-background border-primary-25',
      gradient: 'bg-background border-primary-25',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const collapsibleCardVariants = cva('', {
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

const CollapsibleCardContext = createContext<CollapsibleCardContextValue>({ variant: 'default' });

const useCollapsibleCardContext = () => {
  const context = useContext(CollapsibleCardContext);

  if (!context) throw new Error('CollapsibleCard subcomponents must be used within <CollapsibleCard>');

  return context;
};

const CollapsibleCardHeader: FC<CollapsibleCardHeaderProps> = ({ variant, className, children, ...props }) => {
  const context = useCollapsibleCardContext();

  return (
    <Card.Header
      className={cn(
        'flex items-center justify-between transition-all duration-75',
        'rounded-t-[inherit]',
        'group-data-[state=open]/collapsible-card:border-b group-data-[state=closed]/collapsible-card:[&:has(~[data-slot=card-footer])]:border-b group-data-[state=closed]/collapsible-card:[&:not(:has(~[data-slot=card-footer]))]:border-b-0',
        'group-data-[state=closed]/collapsible-card:[&:not(:has(~[data-slot=card-footer]))]:rounded-b-[inherit]',
        collapsibleCardHeaderVariants({ variant: variant ?? context.variant }),
        className,
      )}
      {...props}
    >
      {children}
    </Card.Header>
  );
};

const CollapsibleCardHeaderLeading: FC<CollapsibleCardHeaderLeadingProps> = ({ className, children, ...props }) => (
  <div
    data-slot="collapsible-card-header-leading"
    className={cn('grid grid-cols-[auto_1fr] items-center gap-x-2', '*:data-[slot=card-description]:col-start-2', className)}
    {...props}
  >
    {children}
  </div>
);

const CollapsibleCardTitle: FC<CollapsibleCardTitleProps> = ({ className, children, ...props }) => (
  <Card.Title className={cn('flex items-center gap-2', className)} {...props}>
    {children}
  </Card.Title>
);

const CollapsibleCardTrigger: FC<CollapsibleCardTriggerProps> = ({ className, children, ...props }) => (
  <Collapsible.Trigger className={cn('group/collapsible-trigger transition-all hover:opacity-80', className)} {...props}>
    {children}
  </Collapsible.Trigger>
);

const CollapsibleCardTriggerIcon: FC<CollapsibleCardTriggerIconProps> = ({ className, children, ...props }) => {
  return (
    children ?? (
      <ChevronDown
        size={16}
        className={cn('shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible-trigger:rotate-180', className)}
        {...props}
      />
    )
  );
};

const CollapsibleCardTooltip: FC<CollapsibleCardTooltipProps> = ({ children, ...props }) => (
  <PrimeTooltip align="start" {...props}>
    <PrimeTooltip.Trigger type="button">
      <Info size={20} className="text-muted-400 inline-block cursor-help" />
    </PrimeTooltip.Trigger>

    <PrimeTooltip.Item>{children}</PrimeTooltip.Item>
  </PrimeTooltip>
);

const CollapsibleCardDescription: FC<CollapsibleCardDescriptionProps> = ({ className, children, ...props }) => (
  <Card.Description className={cn(className)} {...props}>
    {children}
  </Card.Description>
);

const CollapsibleCardContent: FC<CollapsibleCardContentProps> = ({ variant, className, children, ...props }) => (
  <Collapsible.Content>
    <Card.Content className={cn(className)} {...props}>
      {children}
    </Card.Content>
  </Collapsible.Content>
);

const CollapsibleCardFooter: FC<CollapsibleCardFooterProps> = ({ className, children, ...props }) => (
  <Card.Footer className={cn(className)} {...props}>
    {children}
  </Card.Footer>
);

const CollapsibleCard: CollapsibleCardComponent = ({
  open,
  onOpenChange,
  defaultOpen = true,
  disabled,
  className,
  variant,
  children,
  ...props
}) => {
  return (
    <CollapsibleCardContext.Provider value={{ variant }}>
      <Collapsible className="group/collapsible-card" open={open} defaultOpen={defaultOpen} disabled={disabled} onOpenChange={onOpenChange}>
        <Card className={cn(collapsibleCardVariants({ variant }), className)} {...props}>
          {children}
        </Card>
      </Collapsible>
    </CollapsibleCardContext.Provider>
  );
};

CollapsibleCard.Header = CollapsibleCardHeader;
CollapsibleCard.Leading = CollapsibleCardHeaderLeading;
CollapsibleCard.Title = CollapsibleCardTitle;
CollapsibleCard.Trigger = CollapsibleCardTrigger;
CollapsibleCard.TriggerIcon = CollapsibleCardTriggerIcon;
CollapsibleCard.Tooltip = CollapsibleCardTooltip;
CollapsibleCard.Description = CollapsibleCardDescription;
CollapsibleCard.Content = CollapsibleCardContent;
CollapsibleCard.Footer = CollapsibleCardFooter;

export default CollapsibleCard;
