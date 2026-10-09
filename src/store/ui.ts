import { create } from 'zustand';

// Состояние интерфейса, которое не нужно сохранять между визитами.

export type ToastTone = 'default' | 'success' | 'danger' | 'achievement';

export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

interface UIState {
  toasts: Toast[];
  chatsOpen: boolean;
  assistantOpen: boolean;
  notificationsOpen: boolean;
  pushToast: (text: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
  setChatsOpen: (v: boolean) => void;
  setAssistantOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
}

let toastId = 1;

export const useUI = create<UIState>((set) => ({
  toasts: [],
  chatsOpen: false,
  assistantOpen: false,
  notificationsOpen: false,
  pushToast: (text, tone = 'default') => {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, tone }] }));
    window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), tone === 'achievement' ? 5000 : 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setChatsOpen: (v) => set({ chatsOpen: v, assistantOpen: false }),
  setAssistantOpen: (v) => set({ assistantOpen: v, chatsOpen: false }),
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
}));

export const toast = (text: string, tone?: ToastTone) => useUI.getState().pushToast(text, tone);
