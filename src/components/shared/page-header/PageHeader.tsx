'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { IconButton } from '@components/ui';
import { Conditional } from '@components/utils';
import Breadcrumb, { type BreadcrumbLink } from '@components/shared/breadcrumb/Breadcrumb';

import { KitLink } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { ChevronLeft } from 'lucide-react';

export type PageHeaderProps = Omit<ComponentPropsWithoutRef<'header'>, 'title'> & {
  title: ReactNode;
  description?: ReactNode;
  /** A path renders a link; a function renders a button. */
  back?: string | (() => void);
  breadcrumb?: BreadcrumbLink[];
  /** Avatar or icon shown before the title. */
  media?: ReactNode;
  /** Badges and key/value items shown under the description. */
  meta?: ReactNode;
};

type PageHeaderComponent = FC<PageHeaderProps> & {
  Actions: FC<ComponentPropsWithoutRef<'div'>>;
};

const BACK_CLASSES =
  'text-fg-muted hover:bg-hover hover:text-fg focus-visible:ring-ring inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none';

const Actions: FC<ComponentPropsWithoutRef<'div'>> = ({ className, ...props }) => (
  <div data-slot="page-header-actions" className={cn('flex flex-wrap items-center gap-2', className)} {...props} />
);

const PageHeader: PageHeaderComponent = ({ className, title, description, back, breadcrumb, media, meta, children, ...props }) => {
  const { t } = useAppTranslation('common');
  const icon = <ChevronLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />;

  return (
    <header data-slot="page-header" className={cn('flex flex-col gap-3 pb-6', className)} {...props}>
      <Conditional.If condition={!!breadcrumb?.length}>
        <Breadcrumb links={breadcrumb ?? []} />
      </Conditional.If>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-start gap-3">
          <Conditional>
            <Conditional.If condition={typeof back === 'string'}>
              <KitLink href={back as string} aria-label={t('pageHeader.back')} className={BACK_CLASSES}>
                {icon}
              </KitLink>
            </Conditional.If>

            <Conditional.If condition={typeof back === 'function'}>
              <IconButton size="sm" aria-label={t('pageHeader.back')} onClick={back as () => void}>
                {icon}
              </IconButton>
            </Conditional.If>
          </Conditional>

          <Conditional.If condition={!!media}>
            <div data-slot="page-header-media" className="shrink-0">
              {media}
            </div>
          </Conditional.If>

          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-fg text-xl font-semibold tracking-tight">{title}</h1>

            <Conditional.If condition={!!description}>
              <p className="text-fg-muted max-w-prose text-sm">{description}</p>
            </Conditional.If>

            <Conditional.If condition={!!meta}>
              <div data-slot="page-header-meta" className="text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
                {meta}
              </div>
            </Conditional.If>
          </div>
        </div>

        {children}
      </div>
    </header>
  );
};

PageHeader.Actions = Actions;
PageHeader.displayName = 'PageHeader';

export default PageHeader;
