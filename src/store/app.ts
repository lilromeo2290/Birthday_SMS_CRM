'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AppState {
  token: string | null;
  user: User | null;
  currentView: string;
  sidebarOpen: boolean;
  notifications: Notification[];
  unreadCount: number;

  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  setCurrentView: (view: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentView: 'dashboard',
      sidebarOpen: false,
      notifications: [],
      unreadCount: 0,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, currentView: 'dashboard', sidebarOpen: false }),
      setCurrentView: (view) => set({ currentView: view, sidebarOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        }),
      setUnreadCount: (count) => set({ unreadCount: count }),
    }),
    {
      name: 'crm-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const { token, logout } = useAppStore.getState();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    logout();
    return { success: false, error: 'Session expired' };
  }
  return res.json();
}