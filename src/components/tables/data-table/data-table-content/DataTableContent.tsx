import { type MouseEvent } from 'react';
import { flexRender, type Row, type SortDirection } from '@tanstack/react-table';

import { ScrollArea, Table } from '@components/ui';
import { Conditional } from '@components/utils';
import { useDataTableContext } from '@components/tables';

import { cn, getCommonPinningStyles, isInteractiveClick } from '@utils';

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

const ARIA_SORT: Record<SortDirection, 'ascending' | 'descending'> = {
  asc: 'ascending',
  desc: 'descending',
};

type ContentProps = {
  className?: string;
  emptyState?: { title?: string; description?: string };
};

function DataTableContent<TData>({ className, emptyState }: ContentProps) {
  const { table, isLoading, onRowClick, getRowClassName } = useDataTableContext<TData>();

  const isEmpty = !table.getRowModel().rows?.length && !isLoading;
  const visibleColumns = table.getVisibleLeafColumns();

  const onTableRowClick = (event: MouseEvent<HTMLTableRowElement>, row: Row<TData>) => {
    if (isInteractiveClick(event)) return;

    onRowClick?.(row);
  };

  return (
    <ScrollArea
      className={cn('bg-surface border-border min-h-0 flex-1 rounded-lg border', className)}
      viewportClassName="[&>div]:h-full"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && Object.keys(table.getState().rowSelection).length > 0) table.resetRowSelection();
      }}
    >
      <Table className={cn('w-max min-w-full', isEmpty && 'min-h-full')}>
        <Table.Header className="sticky inset-bs-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isPinned = header.column.getIsPinned();
                const canSort = header.column.getCanSort();
                const sortDirection = header.column.getIsSorted();
                const hasExplicitSize = header.column.columnDef.size !== undefined;

                return (
                  <Table.Head
                    key={header.id}
                    numeric={header.column.columnDef.meta?.numeric}
                    colSpan={header.colSpan}
                    aria-sort={sortDirection ? ARIA_SORT[sortDirection] : undefined}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    className={cn('whitespace-nowrap', canSort && 'cursor-pointer select-none')}
                    style={
                      isPinned
                        ? getCommonPinningStyles({ column: header.column, withBorder: true })
                        : hasExplicitSize
                          ? { width: header.column.getSize() }
                          : undefined
                    }
                  >
                    <Conditional.If condition={!header.isPlaceholder}>
                      <div className={cn('flex items-center gap-1', header.column.columnDef.meta?.numeric && 'justify-end')}>
                        {flexRender(header.column.columnDef.header, header.getContext())}

                        <Conditional.If condition={canSort}>
                          <span
                            aria-hidden="true"
                            className={cn('inline-flex shrink-0 [&_svg]:size-3.5', sortDirection ? 'text-fg' : 'text-fg-subtle')}
                          >
                            <Conditional>
                              <Conditional.If condition={sortDirection === 'asc'}>
                                <ArrowUp />
                              </Conditional.If>

                              <Conditional.If condition={sortDirection === 'desc'}>
                                <ArrowDown />
                              </Conditional.If>

                              <Conditional.Else>
                                <ChevronsUpDown />
                              </Conditional.Else>
                            </Conditional>
                          </span>
                        </Conditional.If>
                      </div>
                    </Conditional.If>
                  </Table.Head>
                );
              })}
            </Table.Row>
          ))}
        </Table.Header>

        <Table.Body className="[&_tr:last-child:not([data-slot=table-empty])]:border-b">
          <Table.Loader isLoading={isLoading} colSpan={visibleColumns.length} rows={10} />

          <Conditional.If condition={!!table.getRowModel().rows?.length && !isLoading}>
            {table.getRowModel().rows.map((row) => (
              <Table.Row
                key={row.id}
                onClick={onRowClick ? (event) => onTableRowClick(event, row) : undefined}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                className={getRowClassName?.(row)}
              >
                {row.getVisibleCells().map((cell) => {
                  const isPinned = cell.column.getIsPinned();
                  const isDisabled = cell.column.columnDef.meta?.disableRowClick;
                  const value = cell.getValue();

                  return (
                    <Table.Cell
                      key={cell.id}
                      numeric={cell.column.columnDef.meta?.numeric}
                      title={typeof value === 'string' ? String(value) : undefined}
                      data-disable-row-click={isDisabled || undefined}
                      style={isPinned ? getCommonPinningStyles({ column: cell.column, withBorder: true }) : undefined}
                      className={cn('truncate', isPinned ? 'bg-inherit' : 'max-w-0', onRowClick && !isDisabled && 'cursor-pointer')}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Conditional.If>

          <Table.Empty when={isEmpty} colSpan={visibleColumns.length} {...emptyState} />
        </Table.Body>
      </Table>

      <ScrollArea.Bar orientation="vertical" className="z-20" />

      <ScrollArea.Bar orientation="horizontal" className="z-20" />
    </ScrollArea>
  );
}

export default DataTableContent;
