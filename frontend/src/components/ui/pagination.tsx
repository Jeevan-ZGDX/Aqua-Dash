'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = (() => {
    if (totalPages <= 7) return range(1, totalPages);
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const items: (number | '…')[] = [];
    if (start > 1) {
      items.push(1);
      if (start > 2) items.push('…');
    }
    items.push(...range(start, end));
    if (end < totalPages) {
      if (end < totalPages - 1) items.push('…');
      items.push(totalPages);
    }
    return items;
  })();

  const btn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{from}</span>–<span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> records
      </p>
      <div className="flex items-center gap-1">
        {onPageSizeChange && (
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="mr-2 h-8 rounded-md border border-border bg-card px-2 text-xs text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
        <button className={btn} disabled={page <= 1} onClick={() => onPageChange(1)} aria-label="First page">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                btn,
                p === page
                  ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button className={btn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
