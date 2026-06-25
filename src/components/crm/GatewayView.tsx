'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioTower, Send, CheckCircle2, Settings2, Loader2, Zap } from 'lucide-react';

interface GatewayConfig {
  id: string;
  provider: string;
  isActive: boolean;
  apiKey: string | null;
  apiSecret: string | null;
  senderId: string | null;
  apiUrl: string | null;
}

const PROVIDERS = [
  { id: 'arkesel', name: 'Arkesel', color: 'from-blue-600 to-cyan-600', desc: 'Ghana-based SMS gateway' },
  { id: 'hubtel', name: 'Hubtel', color: 'from-orange-600 to-amber-600', desc: 'Multi-channel messaging' },
  { id: 'africas_talking', name: "Africa's Talking", color: 'from-green-600 to-emerald-600', desc: 'Pan-African communications' },
];

export default function GatewayView() {
  const [configs, setConfigs] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({ apiKey: '', apiSecret: '', senderId: '', apiUrl: '' });
  const [testPhone, setTestPhone] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/settings/gateway');
      if (res.success) setConfigs(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openConfig = (provider: string) => {
    const existing = configs.find(c => c.provider === provider);
    setSelectedProvider(provider);
    setForm({
      apiKey: existing?.apiKey || '',
      apiSecret: existing?.apiSecret || '',
      senderId: existing?.senderId || '',
      apiUrl: existing?.apiUrl || '',
    });
    setConfigOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/api/settings/gateway', {
        method: 'PUT',
        body: JSON.stringify({ provider: selectedProvider, ...form }),
      });
      if (res.success) {
        toast.success('Gateway config saved');
        setConfigOpen(false);
        load();
      } else toast.error(res.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (provider: string) => {
    try {
      const res = await apiFetch('/api/settings/gateway', {
        method: 'POST',
        body: JSON.stringify({ provider }),
      });
      if (res.success) {
        toast.success(`${provider} set as active gateway`);
        load();
      } else toast.error(res.error || 'Failed');
    } catch { toast.error('Failed'); }
  };

  const handleTest = async () => {
    if (!testPhone) { toast.error('Enter a phone number'); return; }
    setTesting(true);
    try {
      const res = await apiFetch('/api/sms/send-test', {
        method: 'POST',
        body: JSON.stringify({ phone: testPhone }),
      });
      if (res.success) toast.success('Test SMS sent!');
      else toast.error(res.error || 'Failed to send');
    } finally {
      setTesting(false);
    }
  };

  const getProviderInfo = (id: string) => PROVIDERS.find(p => p.id === id) || PROVIDERS[0];

  return (
    <div className="space-y-6">
      {/* Test SMS Section */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Send className="h-4 w-4 text-emerald-400" />
            Send Test SMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-slate-300 text-sm mb-1.5 block">Phone Number</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-9" placeholder="+233XXXXXXXXX" />
            </div>
            <Button onClick={handleTest} disabled={testing} className="bg-emerald-600 hover:bg-emerald-500 text-white h-9">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
              Send Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROVIDERS.map((prov) => {
          const config = configs.find(c => c.provider === prov.id);
          const isActive = config?.isActive || false;
          const isConfigured = !!(config?.apiKey || config?.senderId);

          return (
            <Card key={prov.id} className={`bg-slate-900 border transition-all ${isActive ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' : 'border-slate-800'}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${prov.color} flex items-center justify-center`}>
                    <RadioTower className="h-5 w-5 text-white" />
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{prov.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{prov.desc}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className="text-xs text-slate-400">{isConfigured ? 'Configured' : 'Not configured'}</span>
                  </div>
                  {config?.senderId && (
                    <div className="text-xs text-slate-500">
                      Sender ID: <span className="text-slate-300">{config.senderId}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-700 text-slate-300 h-8 text-xs"
                    onClick={() => openConfig(prov.id)}>
                    <Settings2 className="h-3 w-3 mr-1" /> Configure
                  </Button>
                  {!isActive && (
                    <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs"
                      onClick={() => handleSetActive(prov.id)}>
                      <Zap className="h-3 w-3 mr-1" /> Activate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Config Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Configure {getProviderInfo(selectedProvider).name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">API Key</Label>
              <Input value={form.apiKey} onChange={(e) => setForm(f => ({ ...f, apiKey: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white h-9" placeholder="Enter API key" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">API Secret</Label>
              <Input value={form.apiSecret} onChange={(e) => setForm(f => ({ ...f, apiSecret: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white h-9" placeholder="Enter API secret" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Sender ID</Label>
              <Input value={form.senderId} onChange={(e) => setForm(f => ({ ...f, senderId: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white h-9" placeholder="e.g. MyCompany" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">API URL</Label>
              <Input value={form.apiUrl} onChange={(e) => setForm(f => ({ ...f, apiUrl: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white h-9" placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Send Test SMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-slate-300 text-sm">Recipient Phone</Label>
            <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-9" placeholder="+233XXXXXXXXX" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleTest} disabled={testing} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}