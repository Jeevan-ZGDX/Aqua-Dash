'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { ToastViewport } from '@/components/ui/toast-viewport';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <ToastViewport />
      </QueryProvider>
    </ThemeProvider>
  );
}
