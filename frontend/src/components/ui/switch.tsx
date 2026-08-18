'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  icon?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, description, icon, className, ...props }, ref) => {
    return (
      <label className={cn('flex cursor-pointer items-start gap-3', className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onCheckedChange?.(!checked)}
          className={cn(
            'relative mt-0.5 h-5.5 w-9 shrink-0 rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2',
            checked ? 'border-brand-600 bg-brand-600' : 'border-input bg-muted',
          )}
          {...props}
        >
          <span
            className={cn(
              'absolute top-1/2 left-0.5 flex h-4.5 w-4.5 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200',
              checked && 'translate-x-[calc(100%-1px)]',
            )}
          >
            {checked && <Check className="h-3 w-3 text-brand-600" strokeWidth={3} />}
          </span>
        </button>
        {(label || description) && (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              {icon}
              {label}
            </div>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </label>
    );
  },
);
Switch.displayName = 'Switch';
