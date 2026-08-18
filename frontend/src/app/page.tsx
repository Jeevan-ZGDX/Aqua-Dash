'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function RootRedirect() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (session) {
      router.replace(session.user.role === 'HOD' ? '/hod' : '/overview');
    } else {
      router.replace('/login');
    }
  }, [hydrated, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    </div>
  );
}
