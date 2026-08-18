'use client';

import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  debounceMs?: number;
  onDebouncedChange?: (value: string) => void;
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, debounceMs = 300, onDebouncedChange, containerClassName, ...props }, ref) => {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(e);
      if (onDebouncedChange) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onDebouncedChange(e.target.value), debounceMs);
      }
    };

    const handleClear = () => {
      if (inputRef.current) inputRef.current.value = '';
      onClear?.();
      onDebouncedChange?.('');
    };

    return (
      <div className={cn('relative', containerClassName)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref ?? inputRef}
          type="search"
          onChange={handleChange}
          className={cn(
            'h-9 w-full rounded-lg border border-input bg-card pl-9 pr-9 text-sm text-foreground shadow-sm transition-all duration-150 placeholder:text-muted-foreground/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
            className,
          )}
          {...props}
        />
        {props.value ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';
