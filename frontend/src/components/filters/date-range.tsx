'use client';

import { CalendarDays } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DateRangeValue {
  from: string;
  to: string;
}

const presets: { label: string; days: number }[] = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 0 },
];

export function DateRangePicker({
  value,
  onChange,
  maxDate,
  className,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  maxDate?: string;
  className?: string;
}) {
  const today = maxDate ?? new Date().toISOString().slice(0, 10);

  const applyPreset = (days: number) => {
    if (days === 0) {
      onChange({ from: '2020-01-01', to: today });
      return;
    }
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    onChange({ from, to: today });
  };

  const inputCls =
    'h-9 rounded-lg border border-input bg-card px-2.5 text-xs text-foreground shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
              value.from === (p.days === 0 ? '2020-01-01' : new Date(Date.now() - p.days * 86400000).toISOString().slice(0, 10))
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <input type="date" aria-label="From date" value={value.from} max={today} onChange={(e) => onChange({ ...value, from: e.target.value })} className={inputCls} />
        <span className="text-xs text-muted-foreground">to</span>
        <input type="date" aria-label="To date" value={value.to} min={value.from} max={today} onChange={(e) => onChange({ ...value, to: e.target.value })} className={inputCls} />
      </div>
    </div>
  );
}
