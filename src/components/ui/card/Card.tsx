'use client';

import { Children, type ComponentPropsWithoutRef, createContext, type FC, isValidElement, type ReactNode, useContext } from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { IconButton, SectionMarker, type SectionMarkerValue, Skeleton, Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { ChevronDown, Info } from 'lucide-react';

const cardVariants = cva('bg-surface border-border text-fg relative rounded-lg border has-data-[slot=card-header]:rule-top', {
  variants: {
    tone: {
      neutral: '',
      accent: 'bg-accent-subtle',
      info: 'bg-info-subtle',
      success: 'bg-success-subtle',
      warning: 'bg-warning-subtle',
      danger: 'bg-danger-subtle',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
});

export type CardProps = Omit<ComponentPropsWithoutRef<'article'>, 'title'> &
  VariantProps<typeof cardVariants> & {
    /** Header shortcut: renders Card.Header when no explicit header child is given. */
    title?: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    tooltip?: ReactNode;
    collapsible?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Replaces the body with skeleton lines. */
    loading?: boolean;
  };

type CardHeaderProps = ComponentPropsWithoutRef<'header'>;
type CardTitleProps = ComponentPropsWithoutRef<'h3'> & { marker?: SectionMarkerValue };
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

const CardContext = createContext<{ collapsible: boolean }>({ collapsible: false });

// Column 2 holds Card.Actions, column 3 the collapsible toggle; a hairline separates the header from a following body.
const Header: FC<CardHeaderProps> = ({ className, children, ...props }) => {
  const { collapsible } = useContext(CardContext);
  const { t } = useAppTranslation('common');

  return (
    <header
      data-slot="card-header"
      className={cn(
        'border-border-subtle grid auto-rows-min items-start gap-x-2 gap-y-1 px-5 pt-4 not-last:border-b not-last:pb-3',
        'has-data-[slot=card-actions]:grid-cols-[1fr_auto] has-data-[slot=card-toggle]:grid-cols-[1fr_auto_auto]',
        className,
      )}
      {...props}
    >
      {children}

      <Conditional.If condition={collapsible}>
        <CollapsiblePrimitive.Trigger asChild>
          <IconButton
            data-slot="card-toggle"
            size="sm"
            tooltip={false}
            aria-label={t('card.toggle')}
            className="col-start-3 row-start-1 self-start [&[data-state=open]>svg]:rotate-180"
          >
            <ChevronDown className="duration-base transition-transform motion-reduce:transition-none" />
          </IconButton>
        </CollapsiblePrimitive.Trigger>
      </Conditional.If>
    </header>
  );
};

const Title: FC<CardTitleProps> = ({ className, children, marker = 'auto', ...props }) => (
  <h3
    data-slot="card-title"
    className={cn('text-fg text-md col-start-1 flex items-center gap-1.5 leading-tight font-semibold', className)}
    {...props}
  >
    <SectionMarker marker={marker} />
    {children}
  </h3>
);

const Description: FC<CardDescriptionProps> = ({ className, ...props }) => (
  <p data-slot="card-description" className={cn('text-fg-muted col-start-1 text-sm', className)} {...props} />
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

type ShortcutHeaderProps = Pick<CardProps, 'title' | 'description' | 'icon' | 'tooltip'>;

const ShortcutHeader: FC<ShortcutHeaderProps> = ({ title, description, icon, tooltip }) => {
  const { t } = useAppTranslation('common');

  return (
    <Header>
      <div data-slot="card-heading" className={cn('grid min-w-0 items-center gap-x-2 gap-y-0.5', !!icon && 'grid-cols-[auto_1fr]')}>
        <Conditional.If condition={!!icon}>
          <span className="text-fg-muted flex [&_svg]:size-4">{icon}</span>
        </Conditional.If>

        <Title>
          {title}

          <Conditional.If condition={!!tooltip}>
            <Tooltip content={tooltip} align="start">
              <button type="button" aria-label={t('moreInfo')} className="focus-ring text-fg-muted inline-flex cursor-help rounded-sm">
                <Info size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          </Conditional.If>
        </Title>

        <Conditional.If condition={!!description}>
          <Description className={cn(!!icon && 'col-start-2')}>{description}</Description>
        </Conditional.If>
      </div>
    </Header>
  );
};

const LoadingBody: FC = () => (
  <Content aria-busy="true">
    <div className="grid gap-2">
      <Skeleton />
      <Skeleton />
      <Skeleton className="w-2/3" />
    </div>
  </Content>
);

const Card: CardComponent = ({
  className,
  tone,
  title,
  description,
  icon,
  tooltip,
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  loading = false,
  children,
  ...props
}) => {
  const childArray = Children.toArray(children);
  const explicitHeader = childArray.find((child) => isValidElement(child) && child.type === Header);
  const body = childArray.filter((child) => child !== explicitHeader);
  const hasShortcutHeader = !explicitHeader && (title !== undefined || description !== undefined || icon !== undefined);

  const articleProps = {
    'data-slot': 'card',
    'data-tone': tone ?? 'neutral',
    className: cn(cardVariants({ tone }), className),
    ...props,
  };

  const inner = (
    <>
      {explicitHeader}

      <Conditional.If condition={hasShortcutHeader}>
        <ShortcutHeader title={title} description={description} icon={icon} tooltip={tooltip} />
      </Conditional.If>

      <Conditional>
        <Conditional.If condition={collapsible}>
          <CollapsiblePrimitive.Content
            data-slot="card-collapsible-content"
            className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down data-[state=open]:duration-base data-[state=closed]:duration-fast overflow-hidden motion-reduce:animate-none"
          >
            <Conditional>
              <Conditional.If condition={loading}>
                <LoadingBody />
              </Conditional.If>

              <Conditional.Else>{body}</Conditional.Else>
            </Conditional>
          </CollapsiblePrimitive.Content>
        </Conditional.If>

        <Conditional.Else>
          <Conditional>
            <Conditional.If condition={loading}>
              <LoadingBody />
            </Conditional.If>

            <Conditional.Else>{body}</Conditional.Else>
          </Conditional>
        </Conditional.Else>
      </Conditional>
    </>
  );

  return (
    <CardContext.Provider value={{ collapsible }}>
      <Conditional>
        <Conditional.If condition={collapsible}>
          <CollapsiblePrimitive.Root asChild open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
            <article {...articleProps}>{inner}</article>
          </CollapsiblePrimitive.Root>
        </Conditional.If>

        <Conditional.Else>
          <article {...articleProps}>{inner}</article>
        </Conditional.Else>
      </Conditional>
    </CardContext.Provider>
  );
};

Card.Header = Header;
Card.Title = Title;
Card.Description = Description;
Card.Actions = Actions;
Card.Content = Content;
Card.Footer = Footer;

export default Card;
