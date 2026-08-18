'use client';

import { cn } from '@/utils/cn';

export interface TooltipEntry {
  name: string;
  value: number | string;
  color?: string;
}

export function ChartTooltipFrame({
  title,
  entries,
  className,
}: {
  title?: string;
  entries: TooltipEntry[];
  className?: string;
}) {
  return (
    <div className={cn('min-w-[160px] rounded-lg border border-border bg-popover p-3 shadow-dropdown', className)}>
      {title && <p className="mb-1.5 text-xs font-semibold text-foreground">{title}</p>}
      <div className="space-y-1">
        {entries.map((e) => (
          <div key={e.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {e.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />}
              {e.name}
            </span>
            <span className="font-semibold tabular-nums text-foreground">{e.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
