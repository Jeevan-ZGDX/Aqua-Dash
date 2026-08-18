'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarContent } from './sidebar';
import { Topbar } from './topbar';
import { useAuthStore, isSessionExpired } from '@/store/auth-store';
import { cn } from '@/utils/cn';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (hydrated && (!session || isSessionExpired(session))) {
      router.replace('/login');
    }
  }, [hydrated, session, router]);

  if (!hydrated || !session || isSessionExpired(session)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin text-brand-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[268px] animate-slide-in-left border-r border-sidebar-border bg-sidebar shadow-modal">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-sidebar-muted hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className={cn('flex min-h-screen flex-col lg:pl-[248px]')}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
        <footer className="border-t border-border px-6 py-4">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              CSE Admissions Analytics · Chennai Institute of Technology
            </p>
            <p className="text-xs text-muted-foreground">
              Data refreshed {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
