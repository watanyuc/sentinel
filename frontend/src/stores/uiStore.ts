import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

type Language = 'en' | 'th';
type Theme = 'dark' | 'light';

interface UIState {
  toasts: Toast[];
  botFilter: { status: string; broker: string; search: string; sort: string; group: string };
  activeTab: string;
  currentPage: 'dashboard' | 'profile' | 'admin' | 'analytics' | 'trade-history' | 'audit' | 'privacy' | 'calendar';
  language: Language;
  theme: Theme;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setBotFilter: (filter: Partial<UIState['botFilter']>) => void;
  setActiveTab: (tab: string) => void;
  setCurrentPage: (page: UIState['currentPage']) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      toasts: [],
      botFilter: { status: 'all', broker: 'all', search: '', sort: 'name', group: 'all' },
      activeTab: 'overview',
      currentPage: 'dashboard',
      language: 'en',
      theme: 'dark',
      addToast: (toast) => {
        const id = Math.random().toString(36).slice(2);
        set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));
        setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
      setBotFilter: (filter) => set(s => ({ botFilter: { ...s.botFilter, ...filter } })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'sentinel_ui',
      partialize: (s) => ({
        botFilter: s.botFilter,
        language: s.language,
        theme: s.theme,
      }),
    }
  )
);
