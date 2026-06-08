import { type ComponentProps, type FC } from 'react';

import { cn } from '@utils';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

type PaginationProps = ComponentProps<'nav'>;
type PaginationListProps = ComponentProps<'ol'>;
type PaginationItemProps = ComponentProps<'li'>;
type PaginationLinkProps = { isActive?: boolean } & ComponentProps<'button'>;
type PaginationEllipsisProps = ComponentProps<'span'>;

type PaginationComponents = FC<PaginationProps> & {
  List: FC<PaginationListProps>;
  Item: FC<PaginationItemProps>;
  NavButton: FC<PaginationLinkProps>;
  Previous: FC<ComponentProps<typeof NavButton>>;
  Next: FC<ComponentProps<typeof NavButton>>;
  Ellipsis: FC<PaginationEllipsisProps>;
};

const List = ({ className, ...props }: PaginationListProps) => (
  <ol data-slot="pagination-content" className={cn('flex items-center gap-2', className)} {...props} />
);

const Item = ({ ...props }: PaginationItemProps) => <li data-slot="pagination-item" {...props} />;

const NavButton = ({ className, isActive, ...props }: PaginationLinkProps) => (
  <button
    type="button"
    aria-current={isActive ? 'page' : undefined}
    data-slot="pagination-link"
    data-active={isActive}
    className={cn(
      'inline-flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition-colors',
      'size-9 outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      isActive ? 'bg-primary text-primary-foreground dark:bg-primary-300' : 'text-muted-400 hover:text-primary-900 hover:bg-muted-50',
      className,
    )}
    {...props}
  />
);

const Previous = ({ className, ...props }: ComponentProps<typeof NavButton>) => (
  <NavButton aria-label="Go to previous page" className={cn('text-primary size-6 rounded-lg p-0', className)} {...props}>
    <ChevronLeftIcon className="size-6" strokeWidth={1.5} />
  </NavButton>
);

const Next = ({ className, ...props }: ComponentProps<typeof NavButton>) => (
  <NavButton aria-label="Go to next page" className={cn('text-primary size-6 rounded-lg p-0', className)} {...props}>
    <ChevronRightIcon className="size-6" strokeWidth={1.5} />
  </NavButton>
);

const Ellipsis = ({ className, ...props }: PaginationEllipsisProps) => (
  <span
    aria-hidden
    data-slot="pagination-ellipsis"
    className={cn('text-muted-400 flex size-5 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontalIcon className="size-4" />
    <span className="sr-only">More pages</span>
  </span>
);

const Pagination: PaginationComponents = ({ className, ...props }: PaginationProps) => (
  <nav
    role="navigation"
    aria-label="pagination"
    data-slot="pagination"
    className={cn('flex w-full items-center justify-end gap-3 rounded-2xl px-6 py-2', className)}
    {...props}
  />
);

Pagination.List = List;
Pagination.Item = Item;
Pagination.NavButton = NavButton;
Pagination.Previous = Previous;
Pagination.Next = Next;
Pagination.Ellipsis = Ellipsis;

export default Pagination;
