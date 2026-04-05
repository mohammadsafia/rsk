import { type FC, useCallback, useMemo } from 'react';

import { Pagination, Select } from '@components/ui';
import { Conditional } from '@components/utils';
import { useDataTableContext } from '@components/tables';

import { cn } from '@utils';

type PaginationProps = {
  pageSizeOptions?: number[];
  className?: string;
};

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) pages.push('ellipsis');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push('ellipsis');

  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

const DataTablePagination: FC<PaginationProps> = ({ pageSizeOptions = [30, 50, 100, 200], className }) => {
  const { table } = useDataTableContext();

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const handlePageSizeChange = useCallback(
    (value: string) => {
      table.setPageSize(Number(value));
    },
    [table],
  );

  return (
    <div
      data-slot="data-table-pagination"
      className={cn('bg-background flex w-full items-center justify-end gap-4 overflow-hidden rounded-2xl px-7 py-2.5 shadow', className)}
    >
      <div className="bg-primary-25/30 flex items-center gap-2 rounded-full px-3 py-1">
        <span className="text-muted-400 text-xs font-normal whitespace-nowrap">Rows per page</span>

        <Select value={`${table.getState().pagination.pageSize}`} onValueChange={handlePageSizeChange}>
          <Select.Trigger className="h-7 w-14 border-0 bg-transparent px-1 py-0 text-xs font-normal shadow-none focus-visible:ring-0 data-size:h-7">
            <Select.Value placeholder={table.getState().pagination.pageSize} />

            <Select.Icon />
          </Select.Trigger>

          <Select.Content side="top">
            {pageSizeOptions.map((pageSize) => (
              <Select.Item key={pageSize} value={`${pageSize}`}>
                <Select.Text>{pageSize}</Select.Text>
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <Pagination className="w-fit p-0">
        <Pagination.List>
          <Pagination.Item>
            <Pagination.Previous onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} />
          </Pagination.Item>

          {pageNumbers.map((page, index) => (
            <Conditional key={typeof page === 'number' ? page : `ellipsis-${index}`}>
              <Conditional.If condition={page === 'ellipsis'}>
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              </Conditional.If>

              <Conditional.Else>
                <Pagination.Item>
                  <Pagination.NavButton
                    className="size-8.5"
                    onClick={() => table.setPageIndex((page as number) - 1)}
                    isActive={page === currentPage}
                  >
                    {page.toString().padStart(2, '0')}
                  </Pagination.NavButton>
                </Pagination.Item>
              </Conditional.Else>
            </Conditional>
          ))}

          <Pagination.Item>
            <Pagination.Next onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} />
          </Pagination.Item>
        </Pagination.List>
      </Pagination>
    </div>
  );
};

export default DataTablePagination;
