import { flexRender, type Row } from '@tanstack/react-table';

import { ScrollArea, Table } from '@components/ui';
import { Conditional } from '@components/utils';
import { useDataTableContext } from '@components/tables';

import { cn, getCommonPinningStyles } from '@utils';

type ContentProps<TData> = {
  className?: string;
  emptyState?: { title?: string; description?: string };
  onRowClick?: (row: Row<TData>) => void;
  getRowClassName?: (row: Row<TData>) => string;
};

function DataTableContent<TData>({ onRowClick, getRowClassName, className, emptyState }: ContentProps<TData>) {
  const { table, isLoading } = useDataTableContext<TData>();

  const isEmpty = !table.getRowModel().rows?.length && !isLoading;

  return (
    <div data-slot="data-table-content" className={cn('flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg shadow', className)}>
      <Table>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Head
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    ...getCommonPinningStyles({ column: header.column }),
                  }}
                >
                  <Conditional.If condition={!header.isPlaceholder}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Conditional.If>
                </Table.Head>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
      </Table>

      <Conditional.If condition={!isEmpty}>
        <ScrollArea className="min-h-0 flex-1">
          <Table>
            <Table.Body>
              <Table.Loader isLoading={isLoading} colSpan={table.getAllColumns().length} rows={10} />

              <Conditional.If condition={!!table.getRowModel().rows?.length && !isLoading}>
                {table.getRowModel().rows.map((row) => (
                  <Table.Row
                    key={row.id}
                    onClick={() => (onRowClick ? onRowClick(row) : undefined)}
                    data-state={row.getIsSelected() && 'selected'}
                    className={getRowClassName?.(row) ?? ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <Table.Cell
                        key={cell.id}
                        style={{
                          ...getCommonPinningStyles({ column: cell.column }),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Conditional.If>
            </Table.Body>
          </Table>

          <ScrollArea.Bar orientation="vertical" />

          <ScrollArea.Bar orientation="horizontal" />
        </ScrollArea>
      </Conditional.If>

      <Conditional.If condition={isEmpty}>
        <Table className="flex-1">
          <Table.Body>
            <Table.Empty {...emptyState} colSpan={table.getAllColumns().length} when={isEmpty} />
          </Table.Body>
        </Table>
      </Conditional.If>
    </div>
  );
}

export default DataTableContent;
