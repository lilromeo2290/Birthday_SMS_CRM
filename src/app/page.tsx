'use client';

import { useEffect, useState } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import Sidebar, { MobileMenuButton } from '@/components/crm/Sidebar';
import LoginPage from '@/components/crm/LoginPage';
import DashboardView from '@/components/crm/DashboardView';
import ClientsView from '@/components/crm/ClientsView';
import TemplatesView from '@/components/crm/TemplatesView';
import SmsLogsView from '@/components/crm/SmsLogsView';
import GatewayView from '@/components/crm/GatewayView';
import ReportsView from '@/components/crm/ReportsView';
import UsersView from '@/components/crm/UsersView';
import AuditView from '@/components/crm/AuditView';
import SettingsView from '@/components/crm/SettingsView';
import NotificationsView from '@/components/crm/NotificationsView';
import BirthdayAutomationView from '@/components/crm/BirthdayAutomationView';
import { Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VIEW_COMPONENTS: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  clients: ClientsView,
  templates: TemplatesView,
  'sms-logs': SmsLogsView,
  gateway: GatewayView,
  reports: ReportsView,
  users: UsersView,
  audit: AuditView,
  settings: SettingsView,
  notifications: NotificationsView,
  birthday: BirthdayAutomationView,
};

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Client Management',
  templates: 'SMS Templates',
  'sms-logs': 'SMS Logs',
  gateway: 'SMS Gateway',
  reports: 'Reports & Analytics',
  users: 'User Management',
  audit: 'Audit Trail',
  settings: 'Settings',
  notifications: 'Notifications',
  birthday: 'Birthday Automation',
};

function useInitializingState(token: string | null): boolean {
  const { setUser, logout } = useAppStore();
  const [initializing, setInitializing] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiFetch('/api/auth/me').then(res => {
      if (cancelled) return;
      if (res.success) setUser(res.data); else logout();
      setInitializing(false);
    }).catch(() => { if (!cancelled) { logout(); setInitializing(false); } });
    return () => { cancelled = true; };
  }, [token, setUser, logout]);

  return initializing;
}

export default function Home() {
  const { token, user, currentView, setCurrentView, logout, setToken, setUser } = useAppStore();
  const initializing = useInitializingState(token);
  const [refreshing, setRefreshing] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useAppStore.getState().setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const refreshNotifications = async () => {
    setRefreshing(true);
    const res = await apiFetch('/api/notifications');
    setRefreshing(false);
  };

  // Show loading or login
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginPage />;
  }

  // Render main app
  const CurrentViewComponent = VIEW_COMPONENTS[currentView] || DashboardView;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />

      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <MobileMenuButton />
              <h2 className="text-lg font-semibold text-white hidden sm:block">{VIEW_TITLES[currentView]}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white relative" onClick={refreshNotifications}>
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <CurrentViewComponent />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 py-4 px-4 md:px-6 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-slate-600">Birthday SMS CRM v1.0 — Automated Customer Birthday Marketing</p>
            <p className="text-xs text-slate-600">Powered by Next.js 16 + Prisma</p>
          </div>
        </footer>
      </div>
    </div>
  );
}