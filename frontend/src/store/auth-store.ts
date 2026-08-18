'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, User } from '@/types';
import { api } from '@/services/api';

interface AuthState {
  session: AuthSession | null;
  hydrated: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  setHydrated: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      hydrated: false,
      login: (session) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', session.token);
          localStorage.setItem('user', JSON.stringify(session.user));
        }
        set({ session });
      },
      logout: async () => {
        try {
          await api.logout();
        } catch {
          // Ignore logout errors
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
        set({ session: null });
      },
      setHydrated: () => set({ hydrated: true }),
      refreshUser: async () => {
        const { session } = get();
        if (!session) return;
        
        try {
          const user = await api.verifyToken() as User;
          set({ session: { ...session, user } });
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch {
          // Token invalid, logout
          get().logout();
        }
      },
    }),
    {
      name: 'aidds-auth',
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
        // Check if token is still valid on hydration
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (!token) {
            state?.logout();
          }
        }
      },
    },
  ),
);

export function useSession() {
  return useAuthStore((state) => state.session);
}

export function useIsAuthenticated() {
  return useAuthStore((state) => Boolean(state.session));
}

export function isSessionExpired(session: AuthSession): boolean {
  return new Date(session.expiresAt).getTime() < Date.now();
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}