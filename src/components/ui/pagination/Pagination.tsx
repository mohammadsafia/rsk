'use client';

import { type ComponentProps, type FC } from 'react';

import { Button, type ButtonProps, IconButton, type IconButtonProps } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import InkBar from '../ink-bar/InkBar';

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

type PaginationProps = ComponentProps<'nav'>;
type PaginationListProps = ComponentProps<'ol'>;
type PaginationItemProps = ComponentProps<'li'>;
type PaginationNavButtonProps = Omit<ButtonProps, 'variant' | 'tone' | 'size'> & { isActive?: boolean };
type PaginationStepProps = Omit<IconButtonProps, 'children' | 'aria-label'> & { 'aria-label'?: string };
type PaginationEllipsisProps = ComponentProps<'span'>;

type PaginationComponents = FC<PaginationProps> & {
  List: FC<PaginationListProps>;
  Item: FC<PaginationItemProps>;
  NavButton: FC<PaginationNavButtonProps>;
  Previous: FC<PaginationStepProps>;
  Next: FC<PaginationStepProps>;
  Ellipsis: FC<PaginationEllipsisProps>;
};

const List: FC<PaginationListProps> = ({ className, children, ...props }) => (
  // The <ol> is the ink's positioning scope. An <ol> may hold only list items, so the travelling ink sits in a list item
  // of its own: hidden from assistive tech, and absolute, so it takes no place in the row.
  <ol data-slot="pagination-content" data-ink-scope className={cn('relative flex items-center gap-1', className)} {...props}>
    {children}
    <li aria-hidden="true" className="pointer-events-none absolute inset-0">
      <InkBar selector='[aria-current="page"]' />
    </li>
  </ol>
);

const Item: FC<PaginationItemProps> = (props) => <li data-slot="pagination-item" {...props} />;

const NavButton: FC<PaginationNavButtonProps> = ({ className, isActive = false, ...props }) => (
  <Button
    type="button"
    data-slot="pagination-link"
    data-active={isActive}
    aria-current={isActive ? 'page' : undefined}
    variant="ghost"
    size="sm"
    className={cn('min-w-control-sm px-1.5 font-mono tabular-nums no-underline aria-[current=page]:text-fg', className)}
    {...props}
  />
);

const Previous: FC<PaginationStepProps> = ({ 'aria-label': ariaLabel, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <IconButton data-slot="pagination-previous" size="sm" tooltip={false} aria-label={ariaLabel ?? t('pagination.previousPage')} {...props}>
      <ChevronLeftIcon className="rtl:rotate-180" />
    </IconButton>
  );
};

const Next: FC<PaginationStepProps> = ({ 'aria-label': ariaLabel, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <IconButton data-slot="pagination-next" size="sm" tooltip={false} aria-label={ariaLabel ?? t('pagination.nextPage')} {...props}>
      <ChevronRightIcon className="rtl:rotate-180" />
    </IconButton>
  );
};

const Ellipsis: FC<PaginationEllipsisProps> = ({ className, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <span data-slot="pagination-ellipsis" className={cn('text-fg-subtle flex size-7 items-center justify-center', className)} {...props}>
      <MoreHorizontalIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">{t('pagination.morePages')}</span>
    </span>
  );
};

const Pagination: PaginationComponents = ({ className, ...props }) => {
  const { t } = useAppTranslation('common');

  return (
    <nav
      aria-label={t('pagination.label')}
      data-slot="pagination"
      className={cn('flex w-full items-center justify-end gap-3', className)}
      {...props}
    />
  );
};

Pagination.List = List;
Pagination.Item = Item;
Pagination.NavButton = NavButton;
Pagination.Previous = Previous;
Pagination.Next = Next;
Pagination.Ellipsis = Ellipsis;

export default Pagination;
