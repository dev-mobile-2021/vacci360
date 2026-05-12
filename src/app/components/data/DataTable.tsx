import { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Props<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  /** Key accessor used for selection highlight + auto-page-on-select. */
  getRowKey?: (row: T) => string;
  selectedKey?: string | null;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Aucune donnée à afficher.',
  pageSize = 25,
  getRowKey,
  selectedKey,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  // Jump to the page containing the selected row when selection changes.
  useEffect(() => {
    if (!selectedKey || !getRowKey) return;
    const sorted = table.getSortedRowModel().rows;
    const idx = sorted.findIndex((r) => getRowKey(r.original) === selectedKey);
    if (idx < 0) return;
    const page = Math.floor(idx / table.getState().pagination.pageSize);
    if (page !== table.getState().pagination.pageIndex) {
      table.setPageIndex(page);
    }
  }, [selectedKey, getRowKey, table]);

  const totalRows = data.length;
  const pageIdx = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const fromRow = totalRows === 0 ? 0 : pageIdx * pageSize + 1;
  const toRow = Math.min(totalRows, (pageIdx + 1) * pageSize);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-auto border border-stone-200 rounded-md bg-white">
        <table className="w-full text-[13px]">
          <thead className="bg-stone-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const canSort = h.column.getCanSort();
                  return (
                    <th
                      key={h.id}
                      className={cn(
                        'text-left px-3 py-2 font-medium text-stone-600 border-b border-stone-200 whitespace-nowrap',
                        canSort && 'cursor-pointer select-none hover:text-stone-900',
                      )}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                      style={{ width: h.getSize() === 150 ? undefined : h.getSize() }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {canSort && <ArrowUpDown className="h-3 w-3 text-stone-400" />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-stone-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const key = getRowKey?.(row.original);
                const isSelected = key && selectedKey === key;
                return (
                <tr
                  key={row.id}
                  data-row-key={key}
                  className={cn(
                    'border-b border-stone-100 last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-primary-50',
                    isSelected && 'bg-primary-50 ring-1 ring-primary-300',
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-stone-800 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );})
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-2 text-[12px] text-stone-600">
        <div>
          {totalRows > 0
            ? <>Affichage <span className="font-medium tabular-nums">{fromRow}-{toRow}</span> sur <span className="font-medium tabular-nums">{totalRows}</span></>
            : '0 résultat'}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 grid place-items-center rounded border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 tabular-nums">
            {pageIdx + 1} / {Math.max(1, pageCount)}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 grid place-items-center rounded border border-stone-200 hover:bg-stone-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
