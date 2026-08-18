'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  children,
  className,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const active = value ?? internal;

  const setValue = (next: string) => {
    if (onValueChange) onValueChange(next);
    else setInternal(next);
  };

  return (
    <TabsContext.Provider value={{ value: active, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  icon,
  className,
}: {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const active = ctx.value === value;

  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        active
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');
  if (ctx.value !== value) return null;
  return <div role="tabpanel" className={cn('mt-4 animate-fade-in', className)}>{children}</div>;
}
