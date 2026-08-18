'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  className?: string;
  height?: number;
  bodyClassName?: string;
}

export function ChartCard({ title, subtitle, action, children, loading, className, height, bodyClassName }: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn('flex-1 p-5', bodyClassName)} style={height ? { height } : undefined}>
        {loading ? (
          <div className="flex h-full items-end gap-2 pb-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string; value?: number }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
          {item.value !== undefined && <span className="font-medium tabular-nums text-foreground">{item.value}</span>}
        </span>
      ))}
    </div>
  );
}
