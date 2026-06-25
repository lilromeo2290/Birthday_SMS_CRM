'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, MessageSquare, CheckCircle2, XCircle, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

interface MonthlyData { month: string; sent: number; delivered: number; failed: number; }
interface DeliveryStat { name: string; value: number; color: string; }
interface HistoryEntry {
  id: string; recipientName: string; recipientPhone: string;
  message: string; status: string; provider: string; sentAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || ''}`}>{status}</span>;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function ReportsView() {
  const [summary, setSummary] = useState<any>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [delivery, setDelivery] = useState<DeliveryStat[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, mRes, dRes, hRes] = await Promise.all([
        apiFetch('/api/reports/summary'),
        apiFetch('/api/reports/monthly-usage'),
        apiFetch('/api/reports/delivery-stats'),
        apiFetch('/api/sms/logs?page=1&pageSize=50'),
      ]);
      if (sRes.success) setSummary(sRes.data);
      if (mRes.success) setMonthly(mRes.data || []);
      if (dRes.success) {
        const d = dRes.data;
        setDelivery([
          { name: 'Delivered', value: d.delivered || 0, color: '#10b981' },
          { name: 'Sent', value: d.sent || 0, color: '#3b82f6' },
          { name: 'Failed', value: d.failed || 0, color: '#ef4444' },
          { name: 'Pending', value: d.pending || 0, color: '#f59e0b' },
        ]);
      }
      if (hRes.success) { setHistory(hRes.data?.logs || []); setHistoryTotal(hRes.data?.total || 0); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary?.totalClients || 0}</p>
              <p className="text-[11px] text-slate-400">Total Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary?.smsSentThisMonth || 0}</p>
              <p className="text-[11px] text-slate-400">SMS This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary?.failedSms != null ? Math.max(0, ((summary.smsSentThisMonth - summary.failedSms) / Math.max(summary.smsSentThisMonth, 1)) * 100).toFixed(0) : 0}%</p>
              <p className="text-[11px] text-slate-400">Success Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{summary?.todaysBirthdays || 0}</p>
              <p className="text-[11px] text-slate-400">Today's Birthdays</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="overview" className="text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="monthly" className="text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Monthly Usage</TabsTrigger>
          <TabsTrigger value="delivery" className="text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">Delivery Stats</TabsTrigger>
          <TabsTrigger value="history" className="text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white">SMS History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Recent SMS Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e293b' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e293b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sent" fill="#10b981" radius={[4, 4, 0, 0]} name="Sent" />
                    <Bar dataKey="delivered" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Delivered" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">Monthly SMS Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {monthly.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No data available</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e293b' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e293b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sent" fill="#10b981" radius={[4, 4, 0, 0]} name="Sent" />
                      <Bar dataKey="delivered" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Delivered" />
                      <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-emerald-400" /> Delivery Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {delivery.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">No delivery data</p>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={delivery} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                          {delivery.map((entry, i) => (
                            <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {delivery.map((d, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color || COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-slate-300">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-white">{d.value}</span>
                        {delivery.reduce((s, x) => s + x.value, 0) > 0 && (
                          <span className="text-xs text-slate-500 w-12 text-right">
                            {((d.value / delivery.reduce((s, x) => s + x.value, 0)) * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
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
                      <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No history</td></tr>
                    ) : history.map((h) => (
                      <tr key={h.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-white">{h.recipientName}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs hidden md:table-cell">{h.recipientPhone}</td>
                        <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{h.message}</td>
                        <td className="px-4 py-3"><StatusBadge status={h.status} /></td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{new Date(h.sentAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}