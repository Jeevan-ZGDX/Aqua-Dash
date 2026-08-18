'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, ...props }, ref) => {
    const autoId = useId();
    const checkboxId = id ?? autoId;

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative mt-0.5">
          <input ref={ref} id={checkboxId} type="checkbox" className="peer sr-only" {...props} />
          <div className="flex h-4.5 w-4.5 items-center justify-center rounded border border-input bg-card text-transparent shadow-sm transition-all peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40 peer-focus-visible:ring-offset-2 peer-disabled:opacity-55">
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
        </div>
        {(label || description) && (
          <label htmlFor={checkboxId} className="cursor-pointer select-none">
            <span className="text-sm text-foreground">{label}</span>
            {description && <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
