'use client';

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

type BadgeTone =
  | 'neutral'
  | 'blue'
  | 'violet'
  | 'indigo'
  | 'emerald'
  | 'green'
  | 'amber'
  | 'rose'
  | 'brand';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15 dark:bg-sky-950 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-950 dark:text-violet-300',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-950 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-950 dark:text-emerald-300',
  green: 'bg-green-50 text-green-700 ring-green-600/15 dark:bg-green-950 dark:text-green-300',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-950 dark:text-rose-300',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-950 dark:text-brand-300',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ tone = 'neutral', children, className, dot, dotColor }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', dotColor ?? 'bg-current opacity-70')}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
