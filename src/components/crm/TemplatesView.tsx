'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Power, PowerOff, FileText, Loader2, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Template {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  campaign: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', content: '', isDefault: false });
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/templates');
      if (res.success) setTemplates(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', content: 'Happy Birthday {Client Name}! Wishing you a wonderful day from all of us at {Company Name}.', isDefault: false });
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setForm({ name: t.name, content: t.content, isDefault: t.isDefault });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error('Name and content are required'); return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/templates/${editing.id}` : '/api/templates';
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (res.success) {
        toast.success(editing ? 'Template updated' : 'Template created');
        setDialogOpen(false);
        load();
      } else toast.error(res.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: Template) => {
    setToggling(t.id);
    try {
      const res = await apiFetch(`/api/templates/${t.id}/toggle`, { method: 'POST' });
      if (res.success) {
        toast.success(`Template ${t.isActive ? 'deactivated' : 'activated'}`);
        load();
      } else toast.error(res.error || 'Failed');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {templates.length} template{templates.length !== 1 ? 's' : ''} total
            {' · '}
            <span className="text-emerald-400">{templates.filter(t => t.isActive).length} active</span>
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-9">
          <Plus className="h-4 w-4 mr-1.5" /> New Template
        </Button>
      </div>

      {/* Placeholder hints */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          Available placeholders: <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{'{Client Name}'}</code> and <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{'{Company Name}'}</code>
        </p>
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="p-5">
                <div className="h-5 bg-slate-800 rounded w-1/3 mb-3 animate-pulse" />
                <div className="h-4 bg-slate-800 rounded w-full mb-2 animate-pulse" />
                <div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : templates.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <FileText className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No templates yet. Create your first SMS template.</p>
          </div>
        ) : templates.map((t) => (
          <Card key={t.id} className={`bg-slate-900 border transition-colors ${t.isActive ? 'border-emerald-500/30' : 'border-slate-800'}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${t.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                </div>
                {t.isDefault && (
                  <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-medium">Default</span>
                )}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">{t.content}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[10px] text-slate-600">{new Date(t.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className={`h-8 w-8 ${t.isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                    onClick={() => handleToggle(t)} disabled={toggling === t.id}
                  >
                    {toggling === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Template Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white h-9" placeholder="Birthday Greeting" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Message Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white min-h-[120px]" placeholder="Type your message..." />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isDefault} onCheckedChange={(v) => setForm(f => ({ ...f, isDefault: v }))} />
              <Label className="text-slate-300 text-sm">Set as default template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}