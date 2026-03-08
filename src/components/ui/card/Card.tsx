import { type ComponentPropsWithoutRef, type FC } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

type CardHeaderProps = ComponentPropsWithoutRef<'header'>;
type CardTitleProps = ComponentPropsWithoutRef<'h3'>;
type CardDescriptionProps = ComponentPropsWithoutRef<'p'>;
type CardContentProps = ComponentPropsWithoutRef<'section'>;
type CardFooterProps = ComponentPropsWithoutRef<'footer'>;

export type CardVariants = VariantProps<typeof cardVariants>;

export type CardProps = ComponentPropsWithoutRef<'article'> & CardVariants;

type CardComponent = FC<CardProps> & {
  Header: FC<CardHeaderProps>;
  Title: FC<CardTitleProps>;
  Description: FC<CardDescriptionProps>;
  Content: FC<CardContentProps>;
  Footer: FC<CardFooterProps>;
};

export const cardVariants = cva('rounded-2xl bg-background', {
  variants: {
    shadow: {
      none: 'shadow-none',
      default: 'shadow',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
      deep: 'shadow-deep',
      'shadow-boundary': 'shadow-boundary',
      'shadow-boundary-ghost': 'shadow-boundary-ghost',
      'shadow-spread': 'shadow-spread',
      'shadow-inner': 'shadow-inner',
    },
  },
  defaultVariants: {
    shadow: 'default',
  },
});

const Header: FC<CardHeaderProps> = ({ className, ...props }) => (
  <header data-slot="card-header" className={cn('px-6 py-4', className)} {...props} />
);

const Title: FC<CardTitleProps> = ({ className, ...props }) => (
  <h3 data-slot="card-title" className={cn('text-primary-900 text-xl leading-none font-bold', className)} {...props} />
);

const Description: FC<CardDescriptionProps> = ({ className, ...props }) => (
  <p data-slot="card-description" className={cn('text-muted text-sm', className)} {...props} />
);

const Content: FC<CardContentProps> = ({ className, ...props }) => (
  <section data-slot="card-content" className={cn('px-6 py-4', className)} {...props} />
);

const Footer: FC<CardFooterProps> = ({ className, ...props }) => (
  <footer data-slot="card-footer" className={cn('px-6 py-4', className)} {...props} />
);

const Card: CardComponent = ({ className, shadow, ...props }) => (
  <article data-slot="card" className={cn(cardVariants({ shadow }), className)} {...props} />
);

Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Content = Content;
Card.Footer = Footer;

export default Card;
