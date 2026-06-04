import { type ComponentPropsWithoutRef, type FC } from 'react';

import { Card } from '@components/ui';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';
import { PrimeTooltip } from '@components/shared';

type GridCardListProps = ComponentPropsWithoutRef<'ul'> & VariantProps<typeof gridCardListVariants>;
type GridCardItemProps = ComponentPropsWithoutRef<typeof Card>;
type GridCardHeaderProps = ComponentPropsWithoutRef<typeof Card.Header>;
type GridCardTitleProps = ComponentPropsWithoutRef<typeof Card.Title>;
type GridCardDescriptionProps = ComponentPropsWithoutRef<typeof Card.Description>;
type GridCardContentProps = ComponentPropsWithoutRef<typeof Card.Content>;
type GridCardTruncatedTextProps = ComponentPropsWithoutRef<'div'>;
type GridCardFooterProps = ComponentPropsWithoutRef<typeof Card.Footer>;
type GridCardProps = ComponentPropsWithoutRef<'div'>;

type GridCardComponent = FC<GridCardProps> & {
  List: FC<GridCardListProps>;
  Item: FC<GridCardItemProps>;
  Header: FC<GridCardHeaderProps>;
  Title: FC<GridCardTitleProps>;
  Description: FC<GridCardDescriptionProps>;
  Content: FC<GridCardContentProps>;
  TruncatedText: FC<GridCardTruncatedTextProps>;
  Footer: FC<GridCardFooterProps>;
};

const gridCardListVariants = cva('', {
  variants: {
    variant: {
      muted: 'bg-muted-100',
      primary: 'bg-primary-25',
    },
    orientation: {
      vertical:
        '[&>[data-slot=card]:first-child:not(:only-child)]:rounded-s-none [&>[data-slot=card]:last-child:not(:only-child)]:rounded-e-none',
      horizontal: '',
      'flush-top':
        'rounded-se-none [&>[data-slot=card]:first-child:not(:only-child)]:rounded-ss-none [&>[data-slot=card]:last-child:not(:only-child)]:rounded-se-none',
      'flush-bottom':
        'rounded-be-none [&>[data-slot=card]:first-child:not(:only-child)]:rounded-es-none [&>[data-slot=card]:last-child:not(:only-child)]:rounded-ee-none',
    },
  },
  defaultVariants: {
    variant: 'muted',
    orientation: 'horizontal',
  },
});

const List: FC<GridCardListProps> = ({ className, variant, orientation, children, ...props }) => (
  <ul
    data-slot="grid-card-list"
    className={cn(
      'grid list-none auto-cols-[minmax(20rem,1fr)] grid-flow-col gap-0.5 rounded-xl',
      '*:data-[slot=card]:rounded-none',
      '[&>[data-slot=card]:only-child]:rounded-xl',
      '[&>[data-slot=card]:first-child:not(:only-child)]:rounded-s-xl',
      '[&>[data-slot=card]:last-child:not(:only-child)]:rounded-e-xl',
      gridCardListVariants({ variant, orientation }),
      className,
    )}
    {...props}
  >
    {children}
  </ul>
);

const Item: FC<GridCardItemProps> = ({ className, children, ...props }) => {
  return (
    <Card shadow="none" className={cn('flex flex-col items-center justify-start gap-3 px-6 py-3 text-center', className)} {...props}>
      {children}
    </Card>
  );
};

const Header: FC<GridCardHeaderProps> = ({ className, children, ...props }) => {
  return (
    <Card.Header className={cn('text-muted-300 flex flex-col items-center justify-center gap-y-1 px-0 py-0', className)} {...props}>
      {children}
    </Card.Header>
  );
};

const Title: FC<GridCardTitleProps> = ({ className, children, ...props }) => {
  return (
    <Card.Title className={cn('text-muted-400 text-sm font-bold', className)} {...props}>
      {children}
    </Card.Title>
  );
};

const Description: FC<GridCardDescriptionProps> = ({ className, children, ...props }) => {
  return (
    <Card.Description className={cn(className)} {...props}>
      {children}
    </Card.Description>
  );
};

const Content: FC<GridCardContentProps> = ({ className, children, ...props }) => {
  return (
    <Card.Content className={cn('flex w-full flex-col items-center justify-center gap-1 px-0 py-0 font-bold', className)} {...props}>
      {children}
    </Card.Content>
  );
};

const TruncatedText: FC<GridCardTruncatedTextProps> = ({ className, children, ...props }) => {
  return (
    <PrimeTooltip content={children}>
      <div data-slot="grid-card-truncated-text" className={cn('w-full truncate', className)} {...props}>
        {children ?? '-'}
      </div>
    </PrimeTooltip>
  );
};

const Footer: FC<GridCardFooterProps> = ({ className, children, ...props }) => {
  return (
    <Card.Footer className={cn('flex items-center justify-center px-0 py-0', className)} {...props}>
      {children}
    </Card.Footer>
  );
};

const GridCard: GridCardComponent = ({ className, children, ...props }) => {
  return (
    <div data-slot="grid-card" className={cn('w-full min-w-0 overflow-x-auto', className)} {...props}>
      {children}
    </div>
  );
};

GridCard.List = List;
GridCard.Item = Item;
GridCard.Header = Header;
GridCard.Title = Title;
GridCard.Description = Description;
GridCard.Content = Content;
GridCard.TruncatedText = TruncatedText;
GridCard.Footer = Footer;

export default GridCard;
