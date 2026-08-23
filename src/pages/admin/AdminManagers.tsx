import { useEffect, useState } from 'react';
import { Search, Eye, Ban, Check, Plus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { userService, managerService } from '@/services';
import type { User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminManagers() {
  const { toast } = useToast();
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [modelCount, setModelCount] = useState<Record<string, number>>({});
  const [action, setAction] = useState<{ type: string; user: User } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    userService.getByRole('MANAGER').then(async (m) => {
      setManagers(m);
      const counts: Record<string, number> = {};
      for (const mgr of m) {
        const models = await managerService.getModelsByManager(mgr.id);
        counts[mgr.id] = models.length;
      }
      setModelCount(counts);
      setLoading(false);
    });
  }, []);

  const handleAction = async () => {
    if (!action) return;
    const newStatus = action.type === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
    await userService.setStatus(action.user.id, newStatus as any);
    setManagers((prev) => prev.map((u) => (u.id === action.user.id ? { ...u, status: newStatus as any } : u)));
    toast(`Manager ${action.type}ed`);
    setAction(null);
  };

  const filtered = managers.filter((m) => !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase()));

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Managers" subtitle="Manage platform managers" action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Manager</Button>} />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search managers..." className="pl-10" />
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No managers found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'name', label: 'Manager', render: (m: User) => <div className="flex items-center gap-3"><Avatar src={m.avatar} size="sm" /><div><p className="font-semibold text-sm">{m.name}</p><p className="text-xs text-ink-500">{m.email}</p></div></div> },
              { key: 'models', label: 'Models', render: (m: User) => <span className="text-sm font-semibold">{modelCount[m.id] || 0}</span> },
              { key: 'status', label: 'Status', render: (m: User) => <StatusBadge status={m.status} /> },
              { key: 'createdAt', label: 'Joined', render: (m: User) => <span className="text-sm text-ink-500">{formatDate(m.createdAt)}</span> },
              { key: 'actions', label: 'Actions', render: (m: User) => (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(m)}><Eye className="w-3.5 h-3.5" /></Button>
                  {m.status === 'ACTIVE' ? <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'suspend', user: m })} className="text-warning-600"><Ban className="w-3.5 h-3.5" /></Button> : <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'activate', user: m })} className="text-success-600"><Check className="w-3.5 h-3.5" /></Button>}
                </div>
              )},
            ]}
            data={filtered}
            rowKey={(m) => m.id}
            onRowClick={(m) => setSelected(m)}
          />
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Manager Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selected.avatar} size="xl" />
              <div><h3 className="font-display font-bold text-lg">{selected.name}</h3><p className="text-sm text-ink-500">{selected.email}</p><div className="mt-1"><StatusBadge status={selected.status} /></div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Models</p><p className="text-lg font-bold">{modelCount[selected.id] || 0}</p></div>
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Joined</p><p className="text-sm font-semibold">{formatDate(selected.createdAt)}</p></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Manager" size="sm" footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={() => { setShowCreate(false); toast('Manager created successfully'); }}>Create</Button></>}>
        <div className="space-y-4">
          <Input placeholder="Full name" />
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
        </div>
      </Modal>

      <ConfirmDialog open={!!action} onClose={() => setAction(null)} onConfirm={handleAction} title={action?.type === 'activate' ? 'Activate Manager' : 'Suspend Manager'} message={`Are you sure you want to ${action?.type} ${action?.user.name}?`} confirmLabel={action?.type === 'activate' ? 'Activate' : 'Suspend'} danger={action?.type !== 'activate'} />
    </DashboardShell>
  );
}
