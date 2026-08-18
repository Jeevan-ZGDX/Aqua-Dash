'use client';

import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
  remove: (id: string) => void;
}

let counter = 0;

function nextId() {
  counter += 1;
  return `toast-${Date.now()}-${counter}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId();
    const duration = toast.duration ?? 4200;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id, duration }] }));
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  remove: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export function toast(title: string, opts?: { description?: string; tone?: ToastTone; duration?: number }) {
  return useToastStore.getState().push({
    title,
    description: opts?.description,
    tone: opts?.tone ?? 'default',
    duration: opts?.duration ?? 4200,
  });
}
