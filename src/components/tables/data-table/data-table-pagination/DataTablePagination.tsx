'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { type FC, useCallback, useId, useMemo } from 'react';

import { Pagination, Select } from '@components/ui';
import { Conditional } from '@components/utils';
import { useDataTableContext } from '@components/tables';

import { useAppTranslation } from '@hooks/shared';

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
  const { t } = useAppTranslation('common');
  const { table } = useDataTableContext();
  const rowsLabelId = useId();

  const currentPage = table.state.pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  const pageNumbers = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  const pageSize = table.state.pagination.pageSize;

  // A page size set in initialState may not be one of the options; list it so the select can show it.
  const sizeOptions = useMemo(
    () => (pageSizeOptions.includes(pageSize) ? pageSizeOptions : [...pageSizeOptions, pageSize].sort((a, b) => a - b)),
    [pageSizeOptions, pageSize],
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      table.setPageSize(Number(value));
    },
    [table],
  );

  return (
    <div data-slot="data-table-pagination" className={cn('flex w-full flex-wrap items-center justify-between gap-4', className)}>
      <span className="text-fg-muted text-xs">{t('pagination.pageOf', { current: currentPage, total: Math.max(totalPages, 1) })}</span>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span id={rowsLabelId} className="text-fg-muted text-xs whitespace-nowrap">
            {t('pagination.rowsPerPage')}
          </span>

          <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
            <Select.Trigger size="sm" aria-labelledby={rowsLabelId} className="w-20">
              <Select.Value placeholder={pageSize} />

              <Select.Icon />
            </Select.Trigger>

            <Select.Content side="top">
              {sizeOptions.map((option) => (
                <Select.Item key={option} value={`${option}`}>
                  <Select.Text>{option}</Select.Text>
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
                    <Pagination.NavButton onClick={() => table.setPageIndex((page as number) - 1)} isActive={page === currentPage}>
                      {page}
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
    </div>
  );
};

export default DataTablePagination;
