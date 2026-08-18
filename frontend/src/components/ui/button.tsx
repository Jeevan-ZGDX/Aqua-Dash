'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500/40 disabled:hover:bg-brand-600',
  secondary:
    'bg-accent text-accent-foreground hover:bg-accent/80 focus-visible:ring-brand-500/30',
  outline:
    'border border-border bg-card text-foreground shadow-sm hover:bg-muted focus-visible:ring-brand-500/30',
  ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
  destructive:
    'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500/40',
  link: 'text-brand-600 underline-offset-4 hover:underline dark:text-brand-400',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-xs',
  md: 'h-9 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-6 text-sm',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-md',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';
