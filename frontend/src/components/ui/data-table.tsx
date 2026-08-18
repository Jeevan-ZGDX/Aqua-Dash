'use client';

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Pagination } from './pagination';
import { Skeleton } from './skeleton';

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  loading?: boolean;
  loadingRows?: number;
  onRowClick?: (row: TData) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  pagination?: DataTablePagination;
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  dense?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  loading,
  loadingRows = 8,
  onRowClick,
  sorting,
  onSortingChange,
  pagination,
  emptyState,
  toolbar,
  className,
  dense,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns: columns as ColumnDef<TData, unknown>[],
    getRowId,    state: {
      sorting,
      pagination: pagination
        ? { pageIndex: pagination.page - 1, pageSize: pagination.pageSize }
        : undefined,
    },
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      const next = typeof updater === 'function' ? updater(sorting ?? []) : updater;
      onSortingChange(next);
    },
    manualPagination: Boolean(pagination),
    manualSorting: Boolean(onSortingChange),
    getCoreRowModel: getCoreRowModel(),
    enableSorting: Boolean(onSortingChange),
  });

  const hasData = !loading && data.length > 0;
  const isFetchingOverlay = loading && data.length > 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {toolbar}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border bg-muted/60">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className={cn(
                          'whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
                          canSort && 'select-none',
                        )}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {isSorted === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-brand-600" />
                            ) : isSorted === 'desc' ? (
                              <ArrowDown className="h-3 w-3 text-brand-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="relative">
              {loading && data.length === 0 && (
                Array.from({ length: loadingRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-border last:border-0">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className={cn('h-4', j === 0 ? 'w-32' : 'w-20')} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="h-full">
                    {emptyState ?? (
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <p className="text-sm font-medium text-foreground">No records found</p>
                        <p className="mt-1 text-[13px] text-muted-foreground">Try adjusting your filters or search query.</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
              {hasData &&
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={getRowId ? getRowId(row.original, row.index) : row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      'border-b border-border transition-colors last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-muted/50',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn('whitespace-nowrap px-4 text-[13px] text-foreground', dense ? 'py-2' : 'py-3')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {isFetchingOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-card">
              <svg className="h-3.5 w-3.5 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs font-medium text-muted-foreground">Updating…</span>
            </div>
          </div>
        )}
      </div>
      {pagination && !loading && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
}
