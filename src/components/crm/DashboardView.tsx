'use client';
import { useState, useEffect } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Cake, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface SummaryData {
  totalClients: number;
  birthdaysToday: number;
  smsSentToday: number;
  smsSentThisMonth: number;
  failedSms: number;
  upcomingBirthdays: any[];
}

interface SmsLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: string;
  sentAt: string;
}

interface Client {
  id: string;
  clientId: string;
  fullName: string;
  dateOfBirth: string;
  mobileNumber: string;
  status: string;
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string; value: string | number; icon: React.ElementType; trend?: number; color: string }) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{Math.abs(trend)}% from last month</span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/20'}`}>
      {status}
    </span>
  );
}

export default function DashboardView() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [recentSms, setRecentSms] = useState<SmsLog[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, smsRes, clientsRes] = await Promise.all([
        apiFetch('/api/reports/summary'),
        apiFetch('/api/sms/logs?pageSize=8'),
        apiFetch('/api/clients?pageSize=100'),
      ]);
      if (summaryRes.success) {
        const d = summaryRes.data;
        const total = d.smsSentThisMonth || 0;
        const failed = d.failedSms || 0;
        const deliveryRate = total > 0 ? Math.round(((total - failed) / total) * 100) : 0;
        setSummary({ ...d, deliveryRate });
      }
      if (smsRes.success) setRecentSms(smsRes.data.logs || []);
      if (clientsRes.success) {
        const today = new Date();
        const next7 = new Date(today);
        next7.setDate(next7.getDate() + 7);
        const upcoming = (clientsRes.data.clients || []).filter((c: Client) => {
          const bday = new Date(c.dateOfBirth);
          const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
          if (thisYear < today) thisYear.setFullYear(thisYear.getFullYear() + 1);
          return thisYear >= today && thisYear <= next7 && c.status === 'active';
        }).slice(0, 5);
        setUpcomingBirthdays(upcoming);
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dob: string) => {
    const today = new Date();
    const bday = new Date(dob);
    let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (next < today) next.setFullYear(next.getFullYear() + 1);
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff} days`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-5">
                <div className="h-4 bg-slate-800 rounded w-24 mb-3 animate-pulse" />
                <div className="h-8 bg-slate-800 rounded w-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Clients" value={summary?.totalClients || 0} icon={Users} color="bg-blue-600" />
        <StatCard title="SMS This Month" value={summary?.smsSentThisMonth || 0} icon={MessageSquare} color="bg-emerald-600" />
        <StatCard title="Today's Birthdays" value={summary?.birthdaysToday || 0} icon={Cake} color="bg-purple-600" />
        <StatCard title="Delivery Rate" value={`${summary?.deliveryRate || 0}%`} icon={TrendingUp} color="bg-teal-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Birthdays */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Cake className="h-4 w-4 text-purple-400" />
              Upcoming Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No upcoming birthdays in the next 7 days</p>
            ) : (
              <div className="space-y-2">
                {upcomingBirthdays.map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {client.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{client.fullName}</p>
                        <p className="text-xs text-slate-500">{client.mobileNumber}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                      {getDaysUntil(client.dateOfBirth)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent SMS */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Recent SMS Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSms.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No SMS activity yet</p>
            ) : (
              <div className="space-y-2">
                {recentSms.map((sms) => (
                  <div key={sms.id} className="flex items-start justify-between py-2 px-3 rounded-lg bg-slate-800/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{sms.recipientName}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[250px]">{sms.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                      <StatusBadge status={sms.status} />
                      <span className="text-[10px] text-slate-600">{formatDate(sms.sentAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}