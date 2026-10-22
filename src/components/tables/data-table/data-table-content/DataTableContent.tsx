'use client';

// These parts read table state through stable TanStack objects (table / column / row from context and props), which
// compiled memoization would reuse stale; TanStack v9's fix is a Subscribe boundary per reader. Until that refactor,
// they opt out of the React Compiler.
'use no memo';

import { type MouseEvent, useRef } from 'react';
import { flexRender, type SortDirection } from '@tanstack/react-table';

import { ScrollArea, Table } from '@components/ui';
import { Conditional } from '@components/utils';
import { useDataTableContext } from '@components/tables';

import { useMotion } from '@contexts';
import { useFlip, useRowTint } from '@hooks/motion';

import { cn, getCommonPinningStyles, isInteractiveClick, type KitRow } from '@utils';

import { ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { RowData } from '@tanstack/react-table';

const ARIA_SORT: Record<SortDirection, 'ascending' | 'descending'> = {
  asc: 'ascending',
  desc: 'descending',
};

type ContentProps = {
  className?: string;
  emptyState?: { title?: string; description?: string };
};

function DataTableContent<TData extends RowData>({ className, emptyState }: ContentProps) {
  const { table, isLoading, onRowClick, getRowClassName } = useDataTableContext<TData>();
  const { mode } = useMotion();
  // Rows explain changes (spec §4): a changed or new row flashes a tint; a sort glides rows to their new places.
  const scopeRef = useRef<HTMLDivElement>(null);
  const modelRows = table.getRowModel().rows;
  const { sorting, columnFilters, globalFilter, pagination } = table.state;
  const sortKey = JSON.stringify(sorting);
  useRowTint(scopeRef, modelRows, mode, JSON.stringify([sorting, columnFilters, globalFilter, pagination]));
  useFlip(scopeRef, mode, sortKey);

  const isEmpty = !table.getRowModel().rows?.length && !isLoading;
  const visibleColumns = table.getVisibleLeafColumns();

  const onTableRowClick = (event: MouseEvent<HTMLTableRowElement>, row: KitRow<TData>) => {
    if (isInteractiveClick(event)) return;

    onRowClick?.(row);
  };

  return (
    <ScrollArea
      className={cn('bg-surface border-border min-h-0 flex-1 rounded-lg border', className)}
      viewportClassName="[&>div]:h-full"
      onKeyDown={(event) => {
        // A menu, popover or dialog that already handled Escape (Radix prevents default) keeps the selection.
        if (event.defaultPrevented) return;
        if (event.key === 'Escape' && Object.keys(table.state.rowSelection).length > 0) table.resetRowSelection();
      }}
    >
      <div ref={scopeRef} data-slot="data-table-motion-scope" className="contents">
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
                      className="whitespace-nowrap"
                      style={
                        isPinned
                          ? getCommonPinningStyles({ column: header.column, withBorder: true })
                          : hasExplicitSize
                            ? { width: header.column.getSize() }
                            : undefined
                      }
                    >
                      <Conditional.If condition={!header.isPlaceholder}>
                        <Conditional>
                          {/* A sortable header is a real button, so keyboard users can sort (WCAG 2.1.1). */}
                          <Conditional.If condition={canSort}>
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className={cn(
                                'focus-ring -mx-1 inline-flex w-[calc(100%+0.5rem)] cursor-pointer items-center gap-1 rounded-sm px-1 select-none',
                                header.column.columnDef.meta?.numeric && 'justify-end',
                              )}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}

                              <Conditional.If condition={canSort}>
                                <SortIcon direction={sortDirection} />
                              </Conditional.If>
                            </button>
                          </Conditional.If>

                          <Conditional.Else>
                            <div className={cn('flex items-center gap-1', header.column.columnDef.meta?.numeric && 'justify-end')}>
                              {flexRender(header.column.columnDef.header, header.getContext())}

                              <Conditional.If condition={canSort}>
                                <SortIcon direction={sortDirection} />
                              </Conditional.If>
                            </div>
                          </Conditional.Else>
                        </Conditional>
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
                  data-row-id={row.id}
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
      </div>

      <ScrollArea.Bar orientation="vertical" className="z-20" />

      <ScrollArea.Bar orientation="horizontal" className="z-20" />
    </ScrollArea>
  );
}

/** One arrow turns to show the direction instead of swapping icons; unsorted columns show the neutral pair. */
function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  return (
    <span
      aria-hidden="true"
      data-slot="sort-icon"
      className={cn(
        'duration-spring ease-spring inline-flex shrink-0 transition-transform [&_svg]:size-3.5',
        direction ? '[&_svg]:text-fg' : '[&_svg]:text-fg-subtle',
        direction === 'desc' && 'rotate-180',
      )}
    >
      <Conditional>
        <Conditional.If condition={!!direction}>
          <ArrowUp />
        </Conditional.If>

        <Conditional.Else>
          <ChevronsUpDown />
        </Conditional.Else>
      </Conditional>
    </span>
  );
}

export default DataTableContent;
