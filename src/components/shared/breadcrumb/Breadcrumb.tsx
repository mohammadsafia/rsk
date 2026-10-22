'use client';

import { type ReactNode } from 'react';

import { Conditional } from '@components/utils';

import { KitLink } from '@contexts';
import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';
import { PLAIN_ROUTES } from '@routes';

import { ChevronRight } from 'lucide-react';

export type BreadcrumbLink = {
  title: string;
  href?: string;
};

export type BreadcrumbProps = {
  links: BreadcrumbLink[];
  separator?: ReactNode;
  className?: string;
  withRoot?: boolean;
};

const Breadcrumb = ({ className, links, separator, withRoot = false }: BreadcrumbProps) => {
  const { t } = useAppTranslation('common');

  if (links.length === 0 && !withRoot) return null;

  const finalLinks = withRoot
    ? [{ title: t('breadcrumb.root'), href: PLAIN_ROUTES.HOME.INDEX }, ...links.filter((link) => link.href !== PLAIN_ROUTES.HOME.INDEX)]
    : links;

  return (
    <nav data-slot="breadcrumb" aria-label={t('breadcrumbLabel')} className={className}>
      <ol className="text-fg-muted flex flex-wrap items-center gap-1 text-xs">
        {finalLinks.map(({ title, href }, idx) => {
          const isLastItem = idx === finalLinks.length - 1;

          return (
            <li key={`${title}-${idx}`} data-slot="breadcrumb-item" className="flex items-center gap-1">
              <Conditional>
                <Conditional.If condition={!!href && !isLastItem}>
                  <KitLink
                    className="hover:text-fg focus-visible:ring-ring rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    href={href === PLAIN_ROUTES.HOME.INDEX || href === PLAIN_ROUTES.ROOT.INDEX ? href! : `/${href}`}
                  >
                    {title}
                  </KitLink>
                </Conditional.If>

                <Conditional.Else>
                  <span aria-current={isLastItem ? 'page' : undefined} className={cn(isLastItem && 'text-fg')}>
                    {title}
                  </span>
                </Conditional.Else>
              </Conditional>

              <Conditional.If condition={!isLastItem}>
                <span data-slot="breadcrumb-separator" aria-hidden="true" className="text-fg-subtle flex">
                  {separator ?? <ChevronRight className="size-3.5 rtl:-scale-x-100" />}
                </span>
              </Conditional.If>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
