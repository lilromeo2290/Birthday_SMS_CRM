'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Loader2, Cake, Users, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface BirthdayClient {
  id: string;
  clientId: string;
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  customerCategory: string;
}

interface TrackerInfo {
  sentThisYear: number;
  totalTracked: number;
}

export default function BirthdayAutomationView() {
  const [todaysBirthdays, setTodaysBirthdays] = useState<BirthdayClient[]>([]);
  const [tracker, setTracker] = useState<TrackerInfo>({ sentThisYear: 0, totalTracked: 0 });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, summaryRes] = await Promise.all([
        apiFetch('/api/clients?pageSize=200'),
        apiFetch('/api/reports/summary'),
      ]);
      if (clientsRes.success) {
        const today = new Date();
        const todayBdays = (clientsRes.data.clients || []).filter((c: BirthdayClient) => {
          const bday = new Date(c.dateOfBirth);
          return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate() && c.status !== 'inactive';
        });
        setTodaysBirthdays(todayBdays);
      }
      if (summaryRes.success) {
        setTracker({
          sentThisYear: summaryRes.data.smsSentThisMonth || 0,
          totalTracked: summaryRes.data.totalClients || 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRunCheck = async () => {
    setRunning(true);
    try {
      const res = await apiFetch('/api/birthday/check', { method: 'POST' });
      if (res.success) {
        toast.success(res.message || `Birthday check complete. Sent ${res.data?.processed || 0} messages.`);
        load();
      } else {
        toast.error(res.error || 'Birthday check failed');
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Trigger */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Manual Birthday Check</h3>
              <p className="text-sm text-slate-400">Manually trigger the birthday SMS check to send messages for today&apos;s birthdays.</p>
            </div>
            <Button onClick={handleRunCheck} disabled={running} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {running ? 'Running...' : 'Run Birthday Check'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <Cake className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todaysBirthdays.length}</p>
              <p className="text-xs text-slate-400">Today&apos;s Birthdays</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tracker.sentThisYear}</p>
              <p className="text-xs text-slate-400">SMS Sent This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{tracker.totalTracked}</p>
              <p className="text-xs text-slate-400">Total Clients</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Birthdays List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Cake className="h-4 w-4 text-purple-400" />
            Today&apos;s Birthday Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-800 rounded animate-pulse" />)}
            </div>
          ) : todaysBirthdays.length === 0 ? (
            <div className="py-8 text-center">
              <Cake className="h-10 w-10 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No clients have birthdays today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todaysBirthdays.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                      {c.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{c.fullName}</p>
                      <p className="text-xs text-slate-500">{c.mobileNumber} · {c.clientId}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.customerCategory === 'vip' ? 'bg-purple-500/15 text-purple-400' :
                    c.customerCategory === 'premium' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-slate-500/15 text-slate-400'
                  }`}>{c.customerCategory}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}