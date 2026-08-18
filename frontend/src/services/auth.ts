import type { AuthSession, Role, User } from '@/types';
import { api } from './api';

// Helper to decode JWT token (client-side only for UI)
function decodeToken(token: string): { sub: string; role: Role; name: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function setStoredAuth(user: User, accessToken: string, refreshToken: string, expiresIn: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('token_expires_at', String(Date.now() + expiresIn * 1000));
}

function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
}

export async function login(email: string, password: string, remember: boolean): Promise<AuthSession> {
  const response = await api.login(email, password, remember);
  
  // API service returns: { user, token, expiresAt, remember }
  const { user, token, expiresAt } = response;
  
  // Store tokens in localStorage (for Authorization header)
  // HTTP-only cookies are automatically set by backend
  setStoredAuth(user, token, '', 3600); // Refresh token stored in cookie
  
  return {
    user,
    token,
    expiresAt,
  };
}

export async function logout(): Promise<void> {
  try {
    await api.logout();
  } finally {
    clearStoredAuth();
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  if (!refreshToken) return null;
  
  try {
    const response = await api.refreshToken(refreshToken);
    const { access_token, refresh_token: newRefreshToken, expires_in } = response as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    
    const user = getStoredUser();
    if (user) {
      setStoredAuth(user, access_token, newRefreshToken, expires_in);
    }
    
    return access_token;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export async function verifyToken(): Promise<User | null> {
  try {
    const response = await api.verifyToken();
    const user = response as User;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return user;
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  return getStoredUser();
}

export function getAccessToken(): string | null {
  return getStoredToken();
}

export function isAuthenticated(): boolean {
  const token = getStoredToken();
  const user = getStoredUser();
  if (!token || !user) return false;
  
  // Check if token is expired
  const payload = decodeToken(token);
  if (!payload) return false;
  
  return true;
}

export function getAuthSession(): AuthSession | null {
  const user = getStoredUser();
  const token = getStoredToken();
  
  if (!user || !token) return null;
  
  const payload = decodeToken(token);
  const expiresAt = payload ? new Date(payload.exp * 1000).toISOString() : new Date(Date.now() + 3600000).toISOString();
  
  return { user, token, expiresAt };
}

// Initialize auth on app load (check for existing session)
export async function initAuth(): Promise<User | null> {
  // First check if we have stored tokens
  const token = getStoredToken();
  const user = getStoredUser();
  
  if (!token || !user) {
    return null;
  }
  
  // Check if token is still valid
  const payload = decodeToken(token);
  if (!payload) {
    // Try to refresh
    const newToken = await refreshAccessToken();
    if (newToken) {
      return getStoredUser();
    }
    clearStoredAuth();
    return null;
  }
  
  // Token is valid, verify with backend
  const verifiedUser = await verifyToken();
  return verifiedUser;
}