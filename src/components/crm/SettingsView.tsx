'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Building2 } from 'lucide-react';

export default function SettingsView() {
  const [form, setForm] = useState({
    company_name: '',
    company_phone: '',
    sms_signature: '',
    birthday_automation_enabled: 'true',
    daily_check_time: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/settings');
      if (res.success && res.data) {
        const settings = res.data;
        setForm(f => ({
          ...f,
          company_name: settings.company_name || f.company_name,
          company_phone: settings.company_phone || f.company_phone,
          sms_signature: settings.sms_signature || f.sms_signature,
          birthday_automation_enabled: settings.birthday_automation_enabled ?? settings.birthday_scheduler_enabled ?? f.birthday_automation_enabled,
          daily_check_time: settings.daily_check_time || settings.scheduler_time || f.daily_check_time,
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (res.success) {
        toast.success('Settings saved successfully');
      } else toast.error(res.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Company Info */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-400" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Company Name</Label>
            <Input
              value={form.company_name}
              onChange={(e) => updateForm('company_name', e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-9"
              placeholder="Your Company Name"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Company Phone</Label>
            <Input
              value={form.company_phone}
              onChange={(e) => updateForm('company_phone', e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-9"
              placeholder="+233XXXXXXXXX"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">SMS Signature</Label>
            <Input
              value={form.sms_signature}
              onChange={(e) => updateForm('sms_signature', e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-9"
              placeholder="e.g. - Team at CompanyName"
              disabled={loading}
            />
            <p className="text-[11px] text-slate-500">Appended to the end of birthday SMS messages</p>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">Automation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Birthday Automation</p>
              <p className="text-xs text-slate-500">Automatically send birthday SMS messages</p>
            </div>
            <Switch
              checked={form.birthday_automation_enabled === 'true'}
              onCheckedChange={(v) => updateForm('birthday_automation_enabled', String(v))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Daily Check Time</Label>
            <Input
              type="time"
              value={form.daily_check_time}
              onChange={(e) => updateForm('daily_check_time', e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-9 w-40"
              disabled={loading}
            />
            <p className="text-[11px] text-slate-500">When the system checks for daily birthdays</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}