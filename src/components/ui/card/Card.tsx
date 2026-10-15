import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cn } from '@utils';

export type CardProps = ComponentPropsWithoutRef<'article'>;

type CardHeaderProps = ComponentPropsWithoutRef<'header'>;
type CardTitleProps = ComponentPropsWithoutRef<'h3'>;
type CardDescriptionProps = ComponentPropsWithoutRef<'p'>;
type CardActionsProps = ComponentPropsWithoutRef<'div'>;
type CardContentProps = ComponentPropsWithoutRef<'section'>;
type CardFooterProps = ComponentPropsWithoutRef<'footer'>;

type CardComponent = FC<CardProps> & {
  Header: FC<CardHeaderProps>;
  Title: FC<CardTitleProps>;
  Description: FC<CardDescriptionProps>;
  Actions: FC<CardActionsProps>;
  Content: FC<CardContentProps>;
  Footer: FC<CardFooterProps>;
};

// The header gains a trailing column only when it holds Card.Actions.
const Header: FC<CardHeaderProps> = ({ className, ...props }) => (
  <header
    data-slot="card-header"
    className={cn('grid auto-rows-min items-start gap-1 px-5 pt-4 has-data-[slot=card-actions]:grid-cols-[1fr_auto]', className)}
    {...props}
  />
);

const Title: FC<CardTitleProps> = ({ className, ...props }) => (
  <h3 data-slot="card-title" className={cn('text-fg text-md leading-tight font-semibold', className)} {...props} />
);

const Description: FC<CardDescriptionProps> = ({ className, ...props }) => (
  <p data-slot="card-description" className={cn('text-fg-muted text-sm', className)} {...props} />
);

const Actions: FC<CardActionsProps> = ({ className, ...props }) => (
  <div
    data-slot="card-actions"
    className={cn('col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-start justify-self-end', className)}
    {...props}
  />
);

const Content: FC<CardContentProps> = ({ className, ...props }) => (
  <section data-slot="card-content" className={cn('px-5 py-4', className)} {...props} />
);

const Footer: FC<CardFooterProps> = ({ className, ...props }) => (
  <footer data-slot="card-footer" className={cn('border-border-subtle flex items-center gap-2 border-t px-5 py-3', className)} {...props} />
);

const Card: CardComponent = ({ className, ...props }) => (
  <article data-slot="card" className={cn('bg-surface border-border text-fg rounded-lg border', className)} {...props} />
);

Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Actions = Actions;
Card.Content = Content;
Card.Footer = Footer;

export default Card;
