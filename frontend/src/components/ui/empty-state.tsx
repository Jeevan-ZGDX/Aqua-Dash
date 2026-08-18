import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          Try again
        </button>
      )}
    </div>
  );
}
