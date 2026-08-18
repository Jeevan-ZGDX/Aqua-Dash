import { cn } from '@/utils/cn';
import { clamp } from '@/utils/format';

export function Progress({
  value,
  max = 100,
  className,
  tone = 'brand',
  showLabel,
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: 'brand' | 'emerald' | 'amber' | 'rose' | 'sky';
  showLabel?: boolean;
}) {
  const pct = max ? clamp((value / max) * 100, 0, 100) : 0;
  const toneClasses = {
    brand: 'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', toneClasses[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">{Math.round(pct)}%</span>}
    </div>
  );
}
