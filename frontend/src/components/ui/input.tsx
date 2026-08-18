'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, leftAddon, rightAddon, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftAddon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftAddon}
            </div>
          )}
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            className={cn(
              'h-9 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-all duration-150 placeholder:text-muted-foreground/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-55',
              (leftAddon || icon) && 'pl-9',
              rightAddon && 'pr-9',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/25',
              className,
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightAddon}</div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-500" role="alert">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
