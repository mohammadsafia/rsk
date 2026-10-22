'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

import { AlertTriangle, Inbox, SearchX } from 'lucide-react';

type EmptyStateKind = 'first-use' | 'no-results' | 'error';

const KIND: Record<EmptyStateKind, { icon: typeof Inbox; key: 'firstUse' | 'noResults' | 'error' }> = {
  'first-use': { icon: Inbox, key: 'firstUse' },
  'no-results': { icon: SearchX, key: 'noResults' },
  error: { icon: AlertTriangle, key: 'error' },
};

// Fades in when it replaces content.
const emptyStateVariants = cva(
  'animate-in fade-in-0 duration-base ease-out motion-reduce:animate-none flex flex-col items-center text-center',
  {
    variants: {
      size: {
        sm: 'gap-1.5 px-4 py-8 [&_[data-slot=empty-state-icon]]:size-8',
        md: 'gap-2 px-6 py-12 [&_[data-slot=empty-state-icon]]:size-10',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export type EmptyStateProps = ComponentPropsWithoutRef<'div'> &
  VariantProps<typeof emptyStateVariants> & {
    kind?: EmptyStateKind;
    title?: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    /** Heading level of the title; full-page states use `h1`. @default 'h3' */
    titleAs?: 'h1' | 'h2' | 'h3';
  };

type EmptyStateComponent = FC<EmptyStateProps> & {
  Actions: FC<ComponentPropsWithoutRef<'div'>>;
};

const Actions: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => (
  <div data-slot="empty-state-actions" className={cn('mt-3 flex flex-wrap items-center justify-center gap-2', className)} {...props} />
);

const EmptyState: EmptyStateComponent = ({
  className,
  kind = 'first-use',
  title,
  description,
  icon,
  size,
  titleAs: Title = 'h3',
  children,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  const { icon: KindIcon, key } = KIND[kind];

  return (
    <div
      data-slot="empty-state"
      data-kind={kind}
      role={kind === 'error' ? 'alert' : undefined}
      className={cn(emptyStateVariants({ size }), className)}
      {...props}
    >
      <span
        data-slot="empty-state-icon"
        className={cn(
          'text-fg-subtle flex items-center justify-center [&_svg]:size-full',
          !icon && kind !== 'error' && 'figure text-fg relative rule-top w-14 pt-2 size-auto!',
        )}
      >
        <Conditional>
          <Conditional.If condition={!!icon}>{icon}</Conditional.If>

          <Conditional.Else>
            <Conditional>
              <Conditional.If condition={kind === 'error'}>
                <KindIcon aria-hidden="true" strokeWidth={1.5} />
              </Conditional.If>

              <Conditional.Else>
                <span aria-hidden="true">0</span>
              </Conditional.Else>
            </Conditional>
          </Conditional.Else>
        </Conditional>
      </span>

      <Title className="text-fg text-md font-semibold">{title ?? t(`emptyState.${key}.title`)}</Title>

      <p className="text-fg-muted max-w-sm text-sm">{description ?? t(`emptyState.${key}.description`)}</p>

      {children}
    </div>
  );
};

EmptyState.Actions = Actions;
EmptyState.displayName = 'EmptyState';

export default EmptyState;
