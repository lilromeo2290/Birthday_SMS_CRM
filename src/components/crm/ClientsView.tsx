'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore, apiFetch } from '@/store/app';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, Upload, Download, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Client {
  id: string;
  clientId: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  alternativeNumber: string | null;
  emailAddress: string | null;
  residentialAddress: string | null;
  occupation: string | null;
  customerCategory: string;
  notes: string | null;
  status: string;
  createdAt: string;
}

const EMPTY_FORM = {
  fullName: '', gender: 'not_specified', dateOfBirth: '', mobileNumber: '',
  alternativeNumber: '', emailAddress: '', residentialAddress: '', occupation: '',
  customerCategory: 'general', notes: '',
};

export default function ClientsView() {
  const { user } = useAppStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef = useRef<HTMLInputElement>(null);
  const pageSize = 15;

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await apiFetch(`/api/clients?${params}`);
      if (res.success) {
        setClients(res.data.clients);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const totalPages = Math.ceil(total / pageSize);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      fullName: c.fullName, gender: c.gender, dateOfBirth: c.dateOfBirth?.split('T')[0] || '',
      mobileNumber: c.mobileNumber, alternativeNumber: c.alternativeNumber || '',
      emailAddress: c.emailAddress || '', residentialAddress: c.residentialAddress || '',
      occupation: c.occupation || '', customerCategory: c.customerCategory, notes: c.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.dateOfBirth || !form.mobileNumber) {
      toast.error('Name, DOB and phone are required'); return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/clients/${editing.id}` : '/api/clients';
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (res.success) {
        toast.success(editing ? 'Client updated' : 'Client created');
        setDialogOpen(false);
        loadClients();
      } else {
        toast.error(res.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res = await apiFetch(`/api/clients/${deleting.id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Client deleted');
        setDeleteOpen(false);
        setDeleting(null);
        loadClients();
      } else toast.error(res.error || 'Delete failed');
    } catch { toast.error('Delete failed'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/clients/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${useAppStore.getState().token}` },
        body: fd,
      }).then((r) => r.json());
      if (res.success) {
        toast.success(`Imported ${res.data.imported} clients`);
        loadClients();
      } else toast.error(res.error || 'Import failed');
    } catch { toast.error('Import failed'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/clients/export', {
        headers: { Authorization: `Bearer ${useAppStore.getState().token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'clients.csv'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Export downloaded');
      }
    } catch { toast.error('Export failed'); }
  };

  const updateForm = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search clients..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[130px] bg-slate-900 border-slate-800 text-slate-300 h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[130px] bg-slate-900 border-slate-800 text-slate-300 h-9 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={openCreate} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white h-9">
          <Plus className="h-4 w-4 mr-1.5" /> Add Client
        </Button>
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1.5" /> Import CSV
        </Button>
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" /> Export CSV
        </Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden xl:table-cell">DOB</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Category</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td colSpan={8} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse w-full" /></td>
                    </tr>
                  ))
                ) : clients.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No clients found</td></tr>
                ) : clients.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.clientId}</td>
                    <td className="px-4 py-3 text-white font-medium">{c.fullName}</td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{c.mobileNumber}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{c.emailAddress || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 hidden xl:table-cell">{c.dateOfBirth?.split('T')[0]}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.customerCategory === 'vip' ? 'bg-purple-500/15 text-purple-400' :
                        c.customerCategory === 'premium' ? 'bg-amber-500/15 text-amber-400' :
                        c.customerCategory === 'regular' ? 'bg-blue-500/15 text-blue-400' :
                        'bg-slate-500/15 text-slate-400'
                      }`}>{c.customerCategory}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={() => { setDeleting(c); setDeleteOpen(true); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-500">{total} total clients</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}
                  className="h-8 border-slate-700 text-slate-400">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                  className="h-8 border-slate-700 text-slate-400">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-slate-300 text-sm">Full Name *</Label>
                <Input value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-9" placeholder="John Doe" />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-slate-300 text-sm">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => updateForm('gender', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="not_specified">Not Specified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Date of Birth *</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => updateForm('dateOfBirth', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Mobile Number *</Label>
                <Input value={form.mobileNumber} onChange={(e) => updateForm('mobileNumber', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-9" placeholder="+233..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Alt. Number</Label>
                <Input value={form.alternativeNumber} onChange={(e) => updateForm('alternativeNumber', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-9" placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Email</Label>
                <Input type="email" value={form.emailAddress} onChange={(e) => updateForm('emailAddress', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-9" placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Address</Label>
              <Input value={form.residentialAddress} onChange={(e) => updateForm('residentialAddress', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white h-9" placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Occupation</Label>
                <Input value={form.occupation} onChange={(e) => updateForm('occupation', e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-9" placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Category</Label>
                <Select value={form.customerCategory} onValueChange={(v) => updateForm('customerCategory', v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[60px]" placeholder="Optional notes..." />
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Client?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete <strong className="text-white">{deleting?.fullName}</strong> ({deleting?.clientId}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}