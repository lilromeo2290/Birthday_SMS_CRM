'use client';
import { useState } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Settings,
  Cake,
  BarChart3,
  UserCog,
  ScrollText,
  Bell,
  Menu,
  X,
  Gift,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'marketing_admin', 'staff'] },
  { id: 'clients', label: 'Client Management', icon: Users, roles: ['super_admin', 'marketing_admin', 'staff'] },
  { id: 'templates', label: 'SMS Templates', icon: FileText, roles: ['super_admin', 'marketing_admin'] },
  { id: 'sms-logs', label: 'SMS Logs', icon: MessageSquare, roles: ['super_admin', 'marketing_admin', 'staff'] },
  { id: 'gateway', label: 'SMS Gateway', icon: Settings, roles: ['super_admin'] },
  { id: 'birthday', label: 'Birthday Automation', icon: Cake, roles: ['super_admin', 'marketing_admin'] },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['super_admin', 'marketing_admin'] },
  { id: 'users', label: 'User Management', icon: UserCog, roles: ['super_admin'] },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText, roles: ['super_admin'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['super_admin', 'marketing_admin', 'staff'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['super_admin'] },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, currentView, setCurrentView } = useAppStore();
  const filteredItems = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Gift className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight">Birthday SMS</h1>
          <p className="text-[11px] text-emerald-400 font-medium">CRM System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                onNavigate?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileMenuButton() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-slate-400 hover:text-white lg:hidden"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}