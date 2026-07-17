'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Building2, ImageIcon, Trash2, Upload } from 'lucide-react';

export default function SettingsView() {
  const [form, setForm] = useState({
    company_name: '',
    company_phone: '',
    sms_signature: '',
    birthday_automation_enabled: 'true',
    daily_check_time: '08:00',
  });
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/settings');
      if (res.success && res.data) {
        // API returns flat object: { company_name: '...', company_phone: '...', ... }
        const d = res.data;
        if (typeof d === 'object' && !Array.isArray(d)) {
          setForm(f => ({
            ...f,
            company_name: d.company_name || f.company_name,
            company_phone: d.company_phone || f.company_phone,
            sms_signature: d.sms_signature || f.sms_signature,
            birthday_automation_enabled: d.birthday_automation_enabled ?? f.birthday_automation_enabled,
            daily_check_time: d.daily_check_time || f.daily_check_time,
          }));
          if (d.company_logo) {
            setCompanyLogo(d.company_logo);
            setLogoPreview(d.company_logo);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);



  const updateForm = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, or WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCompanyLogo(base64);
      setLogoPreview(base64);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = { ...form };
      if (companyLogo) {
        payload.company_logo = companyLogo;
      } else {
        payload.company_logo = '';
      }
      const res = await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        toast.success('Settings saved successfully');
      } else toast.error(res.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

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

      {/* Company Logo */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-emerald-400" />
            Company Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">Upload your company logo to be included with SMS messages on devices that support rich media (RCS on Android, iMessage on Apple).</p>
          <div className="flex items-start gap-4">
            {logoPreview ? (
              <div className="relative group">
                <div className="w-24 h-24 rounded-xl border-2 border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove logo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 flex flex-col items-center justify-center gap-1">
                <ImageIcon className="h-6 w-6 text-slate-600" />
                <span className="text-[9px] text-slate-600">No logo</span>
              </div>
            )}
            <div className="flex-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9 text-xs"
                  disabled={uploading || loading}
                  asChild
                >
                  <span>
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Upload className="h-3 w-3 mr-1.5" />}
                    {uploading ? 'Processing...' : 'Upload Image'}
                  </span>
                </Button>
              </label>
              <p className="text-[11px] text-slate-600 mt-2">PNG, JPG, or WebP. Max 2MB.</p>
              <p className="text-[11px] text-slate-600">Recommended: 200x200px square logo</p>
            </div>
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