import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';

import { Skeleton } from '@components/ui';
import { PrimeLoader } from '@components/shared';

import { cn } from '@utils';

import { Search } from 'lucide-react';

type TableProps = ComponentPropsWithoutRef<'table'> & {
  isLoading?: boolean;
};

type TableHeaderProps = ComponentPropsWithoutRef<'thead'>;
type TableBodyProps = ComponentPropsWithoutRef<'tbody'>;
type TableFooterProps = ComponentPropsWithoutRef<'tfoot'>;
type TableRowProps = ComponentPropsWithoutRef<'tr'>;
type TableHeadProps = ComponentPropsWithoutRef<'th'>;
type TableCellProps = ComponentPropsWithoutRef<'td'>;
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

const Header = ({ className, ...props }: TableHeaderProps) => (
  <thead data-slot="table-header" className={cn('bg-primary-15 [&_tr]:border-muted-200 [&_tr]:border-b', className)} {...props} />
);

const Body = ({ className, ...props }: TableBodyProps) => (
  <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
);

const Footer = ({ className, ...props }: TableFooterProps) => (
  <tfoot data-slot="table-footer" className={cn('bg-secondary text-primary-900 font-medium', className)} {...props} />
);

const Row = ({ className, ...props }: TableRowProps) => (
  <tr
    data-slot="table-row"
    className={cn(
      'hover:bg-primary-15 data-[state=selected]:bg-primary-15 border-muted-200 bg-background border-b transition-colors',
      className,
    )}
    {...props}
  />
);

const Head = ({ className, ...props }: TableHeadProps) => (
  <th
    data-slot="table-head"
    className={cn(
      'bg-primary-25 text-primary-700 px-6 py-3 text-start align-middle text-xs font-bold [&:has([role=checkbox])]:pe-0',
      className,
    )}
    {...props}
  />
);

const Cell = ({ className, ...props }: TableCellProps) => (
  <td data-slot="table-cell" className={cn('h-18 px-6 py-3 align-middle text-xs [&:has([role=checkbox])]:pe-0', className)} {...props} />
);

const Caption = ({ className, ...props }: TableCaptionProps) => (
  <caption data-slot="table-caption" className={cn('text-muted-foreground mt-4 text-sm', className)} {...props} />
);

const Empty = ({
  className,
  colSpan = 1,
  title = 'No Results Found',
  description = 'No results found for your search. Please try again with different keywords.',
  when,
  ...props
}: TableEmptyProps) => {
  if (!when) return null;

  return (
    <tr data-slot="table-empty" className={cn('h-full hover:bg-transparent', className)} {...props}>
      <td colSpan={colSpan} className="bg-muted-50 text-center">
        <div className="relative inline-flex h-30 flex-col items-center justify-center">
          <Search strokeWidth={1.5} className="text-muted-200 absolute top-1/2 left-1/2 size-30 -translate-x-1/2 -translate-y-1/2" />

          <div className="relative flex flex-col items-center gap-1">
            <span className="text-muted-400 block text-lg font-medium capitalize">{title}</span>

            <span className="text-muted-400 block text-sm font-normal">{description}</span>
          </div>
        </div>
      </td>
    </tr>
  );
};

const TableLoader = ({ colSpan, loaderType = 'skeleton', isLoading = false, rows = 10 }: TableLoaderProps) => {
  if (!isLoading) return null;

  if (loaderType === 'spinner') return <PrimeLoader data-slot="table-loader" displayLogo={false} withOverlay={false} />;

  return (
    <>
      {Array.from({ length: rows }, (_, idx) => (
        <Row key={`skeleton-row-${idx}`} data-slot="table-loader">
          {Array.from({ length: colSpan }, (_, colIndex) => (
            <Cell key={`skeleton-cell-${idx}-${colIndex}`}>
              <Skeleton />
            </Cell>
          ))}
        </Row>
      ))}
    </>
  );
};

const Table: TableComponents = ({ className, ...props }) => (
  <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props} />
);

Table.Header = Header;
Table.Body = Body;
Table.Footer = Footer;
Table.Row = Row;
Table.Head = Head;
Table.Cell = Cell;
Table.Caption = Caption;
Table.Empty = Empty;
Table.Loader = TableLoader;

export default Table;
