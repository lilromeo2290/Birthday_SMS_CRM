'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface SmsLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: string;
  provider: string;
  sentAt: string;
  deliveredAt: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>{status}</span>;
}

export default function SmsLogsView() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (providerFilter !== 'all') params.set('provider', providerFilter);
      const res = await apiFetch(`/api/sms/logs?${params}`);
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, providerFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-slate-900 border-slate-800 text-slate-300 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-slate-900 border-slate-800 text-slate-300 h-9 text-sm">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="arkesel">Arkesel</SelectItem>
            <SelectItem value="hubtel">Hubtel</SelectItem>
            <SelectItem value="africas_talking">Africa&apos;s Talking</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 ml-auto">{total} total logs</p>
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Recipient</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Message</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Provider</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden xl:table-cell">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse w-full" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <MessageSquare className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-500">No SMS logs found</p>
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{log.recipientName}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{log.recipientPhone}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[250px] truncate">{log.message}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell capitalize">{log.provider.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell">{new Date(log.sentAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 border-slate-700 text-slate-400">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-8 border-slate-700 text-slate-400">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}