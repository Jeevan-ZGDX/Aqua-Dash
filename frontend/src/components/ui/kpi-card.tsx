'use client';

import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCompact, formatDelta, formatNumber, formatPercent } from '@/utils/format';
import { Skeleton } from './skeleton';

export interface KpiCardProps {
  label: string;
  value: number;
  format?: 'number' | 'percent' | 'currency';
  delta?: number;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  hint?: string;
  icon?: LucideIcon;
  iconTone?: string;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
}

export function KpiCard({
  label,
  value,
  format = 'number',
  delta,
  deltaLabel,
  trend,
  hint,
  icon: Icon,
  iconTone = 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400',
  loading,
  className,
  valueClassName,
}: KpiCardProps) {
  const formatted =
    format === 'percent'
      ? formatPercent(value)
      : format === 'currency'
        ? `₹${formatNumber(value)}`
        : value >= 10000
          ? formatCompact(value)
          : formatNumber(value);

  const showDelta = delta !== undefined && delta !== null;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover',
        className,
      )}
    >
      {loading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
            {Icon && (
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105', iconTone)}>
                <Icon className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('text-[26px] font-semibold leading-none tracking-tight text-foreground tabular-nums', valueClassName)}>
              {formatted}
            </span>
            {showDelta && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  trend === 'up' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
                  trend === 'down' && 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
                  trend === 'flat' && 'bg-muted text-muted-foreground',
                )}
              >
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {formatDelta(delta)}
              </span>
            )}
          </div>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint ?? deltaLabel}</p>
        </>
      )}
    </div>
  );
}
