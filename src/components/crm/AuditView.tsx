'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  module: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string };
}

export default function AuditView() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (moduleFilter !== 'all') params.set('module', moduleFilter);
      if (actionFilter !== 'all') params.set('action', actionFilter);
      const res = await apiFetch(`/api/audit?${params}`);
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, actionFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);
  const actionColors: Record<string, string> = {
    CREATE: 'bg-emerald-500/15 text-emerald-400',
    UPDATE: 'bg-blue-500/15 text-blue-400',
    DELETE: 'bg-red-500/15 text-red-400',
    LOGIN: 'bg-purple-500/15 text-purple-400',
    SEND: 'bg-cyan-500/15 text-cyan-400',
    IMPORT: 'bg-amber-500/15 text-amber-400',
    EXPORT: 'bg-teal-500/15 text-teal-400',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px] bg-slate-900 border-slate-800 text-slate-300 h-9 text-sm">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="clients">Clients</SelectItem>
            <SelectItem value="templates">Templates</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="users">Users</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-slate-900 border-slate-800 text-slate-300 h-9 text-sm">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="SEND">Send</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 ml-auto">{total} entries</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Module</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Details</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse w-full" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <ScrollText className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-500">No audit entries found</p>
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{log.user?.name || 'System'}</p>
                      <p className="text-slate-600 text-[10px]">{log.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || 'bg-slate-500/15 text-slate-400'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{log.module}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[250px] truncate hidden md:table-cell">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-mono hidden lg:table-cell">
                      {log.ipAddress || '—'}
                    </td>
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