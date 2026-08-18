'use client';

import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  icon?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, icon, id, ...props }, ref) => {
    const autoId = useId();
    const selectId = id ?? autoId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            className={cn(
              'h-9 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-sm text-foreground shadow-sm transition-all duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-55',
              icon && 'pl-9',
              error && 'border-rose-400',
              className,
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
Select.displayName = 'Select';
