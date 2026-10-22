'use client';

import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Skeleton } from '@components/ui';
import { Conditional } from '@components/utils';
import EmptyState from '@components/ui/empty-state/EmptyState';
import Spinner from '@components/ui/spinner/Spinner';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

type TableProps = ComponentPropsWithoutRef<'table'> & {
  isLoading?: boolean;
};

type TableHeaderProps = ComponentPropsWithoutRef<'thead'>;
type TableBodyProps = ComponentPropsWithoutRef<'tbody'>;
type TableFooterProps = ComponentPropsWithoutRef<'tfoot'>;
type TableRowProps = ComponentPropsWithoutRef<'tr'>;
type TableHeadProps = ComponentPropsWithoutRef<'th'> & { numeric?: boolean };
type TableCellProps = ComponentPropsWithoutRef<'td'> & { numeric?: boolean };
type TableCaptionProps = ComponentPropsWithoutRef<'caption'>;
type TableEmptyProps = ComponentPropsWithoutRef<'tr'> & {
  colSpan?: number;
  title?: ReactNode;
  description?: ReactNode;
  when: boolean;
};
type TableLoaderProps = {
  colSpan: number;
  rows?: number;
  isLoading?: boolean;
  loaderType?: 'skeleton' | 'spinner';
};

type TableComponents = FC<TableProps> & {
  Header: FC<TableHeaderProps>;
  Body: FC<TableBodyProps>;
  Footer: FC<TableFooterProps>;
  Row: FC<TableRowProps>;
  Head: FC<TableHeadProps>;
  Cell: FC<TableCellProps>;
  Caption: FC<TableCaptionProps>;
  Empty: FC<TableEmptyProps>;
  Loader: FC<TableLoaderProps>;
};

const Header: FC<TableHeaderProps> = ({ className, ...props }) => (
  <thead data-slot="table-header" className={cn('bg-surface-sunken [&_tr]:border-border-subtle [&_tr]:border-b', className)} {...props} />
);

const Body: FC<TableBodyProps> = ({ className, ...props }) => (
  <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

const Footer: FC<TableFooterProps> = ({ className, ...props }) => (
  <tfoot
    data-slot="table-footer"
    className={cn('bg-surface-sunken text-fg border-border-subtle border-t font-medium', className)}
    {...props}
  />
);

const Row: FC<TableRowProps> = ({ className, ...props }) => (
  <tr
    data-slot="table-row"
    className={cn('border-border-subtle hover:bg-hover data-[state=selected]:bg-accent-subtle border-b transition-colors', className)}
    {...props}
  />
);

const Head: FC<TableHeadProps> = ({ className, numeric = false, ...props }) => (
  <th
    data-slot="table-head"
    data-numeric={numeric || undefined}
    className={cn(
      'text-fg-muted h-9 px-4 text-start align-middle text-xs font-medium whitespace-nowrap [&:has([role=checkbox])]:pe-0',
      numeric && 'text-end',
      className,
    )}
    {...props}
  />
);

// Numeric values keep `dir="ltr"` on an inner span so the cell itself still aligns to the table's inline end.
const Cell: FC<TableCellProps> = ({ className, numeric = false, children, ...props }) => (
  <td
    data-slot="table-cell"
    data-numeric={numeric || undefined}
    className={cn(
      'text-fg h-11 px-4 py-2 text-start align-middle text-sm [&:has([role=checkbox])]:pe-0',
      numeric && 'text-end font-mono tabular-nums',
      className,
    )}
    {...props}
  >
    <Conditional>
      <Conditional.If condition={numeric}>
        <span dir="ltr">{children}</span>
      </Conditional.If>

      <Conditional.Else>{children}</Conditional.Else>
    </Conditional>
  </td>
);

const Caption: FC<TableCaptionProps> = ({ className, ...props }) => (
  <caption data-slot="table-caption" className={cn('text-fg-muted mt-4 text-sm', className)} {...props} />
);

const Empty: FC<TableEmptyProps> = ({ className, colSpan = 1, title, description, when, ...props }) => {
  const { t } = useAppTranslation('common');

  if (!when) return null;

  return (
    <tr data-slot="table-empty" className={cn('h-full hover:bg-transparent', className)} {...props}>
      <td colSpan={colSpan}>
        <EmptyState
          size="sm"
          kind="no-results"
          title={title ?? t('table.emptyTitle')}
          description={description ?? t('table.emptyDescription')}
        />
      </td>
    </tr>
  );
};

const Loader: FC<TableLoaderProps> = ({ colSpan, loaderType = 'skeleton', isLoading = false, rows = 10 }) => {
  const { t } = useAppTranslation('common');

  if (!isLoading) return null;

  return (
    <Conditional>
      <Conditional.If condition={loaderType === 'spinner'}>
        <tr data-slot="table-loader">
          <td colSpan={colSpan} className="py-12 text-center">
            <Spinner />
          </td>
        </tr>
      </Conditional.If>

      <Conditional.Else>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <Row key={`skeleton-row-${rowIndex}`} data-slot="table-loader" aria-hidden="true">
            {Array.from({ length: colSpan }, (_, colIndex) => (
              <Cell key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                <Skeleton />
              </Cell>
            ))}
          </Row>
        ))}
        <tr className="sr-only">
          <td colSpan={colSpan}>
            <span role="status">{t('loading')}</span>
          </td>
        </tr>
      </Conditional.Else>
    </Conditional>
  );
};

const Table: TableComponents = ({ className, isLoading = false, ...props }) => (
  <table data-slot="table" aria-busy={isLoading || undefined} className={cn('w-full caption-bottom text-sm', className)} {...props} />
);

Table.Header = Header;
Table.Body = Body;
Table.Footer = Footer;
Table.Row = Row;
Table.Head = Head;
Table.Cell = Cell;
Table.Caption = Caption;
Table.Empty = Empty;
Table.Loader = Loader;

export default Table;
