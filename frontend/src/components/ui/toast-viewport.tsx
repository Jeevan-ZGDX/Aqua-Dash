'use client';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type ToastTone } from '@/store/toast-store';
import { cn } from '@/utils/cn';

const toneStyles: Record<ToastTone, { icon: typeof Info; ring: string; iconColor: string }> = {
  default: { icon: Info, ring: 'border-slate-200 dark:border-slate-700', iconColor: 'text-slate-500' },
  success: { icon: CheckCircle2, ring: 'border-emerald-200 dark:border-emerald-800', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'border-rose-200 dark:border-rose-800', iconColor: 'text-rose-500' },
  warning: { icon: AlertTriangle, ring: 'border-amber-200 dark:border-amber-800', iconColor: 'text-amber-500' },
  info: { icon: Info, ring: 'border-sky-200 dark:border-sky-800', iconColor: 'text-sky-500' },
};

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const remove = useToastStore((state) => state.remove);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2.5"
    >
      {toasts.map((t) => {
        const style = toneStyles[t.tone];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            onMouseEnter={() => dismiss(t.id)}
            className={cn(
              'pointer-events-auto relative flex animate-fade-in items-start gap-3 rounded-lg border bg-card p-3.5 pr-9 shadow-dropdown',
              style.ring,
            )}
          >
            <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', style.iconColor)} />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight text-card-foreground">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              aria-label="Dismiss notification"
              className="absolute right-2.5 top-2.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
