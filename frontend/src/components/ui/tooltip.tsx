'use client';

import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const sideClasses = {
  top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
  left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
  right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
};

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      {content && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-[70] w-max max-w-56 whitespace-normal rounded-md bg-slate-900 px-2 py-1 text-center text-[11px] font-medium leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 dark:bg-slate-100 dark:text-slate-900',
            sideClasses[side],
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
