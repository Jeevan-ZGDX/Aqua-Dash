'use client';

import { cn } from '@/utils/cn';

export interface SegmentOption {
  label: string;
  value: string;
}

export function SegmentControl({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5" role="tablist" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.value}
            role="tab"
            aria-selected={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              value === opt.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
