import { type ComponentProps, type FC } from 'react';

import { Card } from '@components/ui';

import { cn } from '@utils';

type GridCardProps = ComponentProps<'div'>;
type GridCardListProps = ComponentProps<'ul'>;
type GridCardItemProps = ComponentProps<typeof Card>;
type GridCardHeaderProps = ComponentProps<typeof Card.Header>;
type GridCardTitleProps = ComponentProps<typeof Card.Title>;
type GridCardDescriptionProps = ComponentProps<typeof Card.Description>;
type GridCardContentProps = ComponentProps<typeof Card.Content>;
type GridCardFooterProps = ComponentProps<typeof Card.Footer>;

type GridCardComponent = FC<GridCardProps> & {
  List: FC<GridCardListProps>;
  Item: FC<GridCardItemProps>;
  Header: FC<GridCardHeaderProps>;
  Title: FC<GridCardTitleProps>;
  Description: FC<GridCardDescriptionProps>;
  Content: FC<GridCardContentProps>;
  Footer: FC<GridCardFooterProps>;
};

const List: FC<GridCardListProps> = ({ className, children, ...props }) => (
  <ul
    data-slot="grid-card-list"
    className={cn(
      'flex list-none rounded-xl',
      '*:data-[slot=card]:rounded-none',
      '[&>[data-slot=card]:only-child]:rounded-xl',
      '[&>[data-slot=card]:first-child:not(:only-child)]:rounded-s-xl',
      '[&>[data-slot=card]:last-child:not(:only-child)]:rounded-e-xl',
      '[&>[data-slot=card]:not(:last-child):not(:only-child)]:border-e-2 [&>[data-slot=card]:not(:last-child):not(:only-child)]:border-primary-25',
      className,
    )}
    {...props}
  >
    {children}
  </ul>
);

const Item: FC<GridCardItemProps> = ({ className, children, ...props }) => {
  return (
    <Card shadow="md" className={cn('flex flex-1 flex-col items-center justify-center px-6 py-3 text-center', className)} {...props}>
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
    <Card.Title className={cn('text-muted-400 text-xs font-normal', className)} {...props}>
      {children}
    </Card.Title>
  );
};

const Description: FC<GridCardDescriptionProps> = ({ className, children, ...props }) => {
  return (
    <Card.Description className={cn('', className)} {...props}>
      {children}
    </Card.Description>
  );
};

const Content: FC<GridCardContentProps> = ({ className, children, ...props }) => {
  return (
    <Card.Content className={cn('flex flex-col items-center justify-center px-0 py-0 font-bold', className)} {...props}>
      {children}
    </Card.Content>
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
    <div className={cn('w-full', className)} {...props}>
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
GridCard.Footer = Footer;

export default GridCard;
