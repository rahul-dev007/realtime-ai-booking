import { create } from 'zustand';

type Toast = { id: string; title: string; description?: string; variant?: 'default'|'destructive' };
type ToastState = {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: (t) => set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), ...t }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),
}));

export function toast(t: Omit<Toast, 'id'>) {
  useToastStore.getState().toast(t);
}
