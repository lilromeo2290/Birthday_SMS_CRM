'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, AlertTriangle, XCircle, Loader2, Cake } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  low_credits: AlertTriangle,
  failed_delivery: XCircle,
  upcoming_birthday: Cake,
  system_error: AlertTriangle,
};
const typeColors: Record<string, string> = {
  low_credits: 'text-amber-400 bg-amber-500/15',
  failed_delivery: 'text-red-400 bg-red-500/15',
  upcoming_birthday: 'text-purple-400 bg-purple-500/15',
  system_error: 'text-red-400 bg-red-500/15',
};

export default function NotificationsView() {
  const { setNotifications, setUnreadCount } = useAppStore();
  const [notifications, setLocalNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/notifications');
      if (res.success) {
        // API returns { data: { notifications: [...], unreadCount: N } }
        const items = res.data?.notifications || res.data || [];
        setLocalNotifications(Array.isArray(items) ? items : []);
        setUnreadCount(res.data?.unreadCount || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setUnreadCount]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'POST' });
      if (res.success) {
        toast.success('All marked as read');
        load();
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {notifications.filter(n => !n.isRead).length} unread notification{notifications.filter(n => !n.isRead).length !== 1 ? 's' : ''}
        </p>
        {notifications.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={markingAll}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8 text-xs">
            {markingAll ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCheck className="h-3 w-3 mr-1" />}
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <div className="h-4 bg-slate-800 rounded w-1/3 mb-2 animate-pulse" />
                <div className="h-3 bg-slate-800 rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No notifications yet</p>
            <p className="text-slate-600 text-xs mt-1">Notifications will appear here when events occur</p>
          </div>
        ) : notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          const color = typeColors[n.type] || 'text-slate-400 bg-slate-500/15';
          return (
            <Card key={n.id} className={`bg-slate-900 border transition-colors ${n.isRead ? 'border-slate-800 opacity-60' : 'border-slate-700'}`}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</h4>
                      <span className="text-[10px] text-slate-600 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}