import { useEffect, useState } from 'react';
import { Search, Eye, BadgeCheck, UserCog, Ban, Check } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { userService } from '@/services';
import type { User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminModels() {
  const { toast } = useToast();
  const [models, setModels] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selected, setSelected] = useState<User | null>(null);
  const [action, setAction] = useState<{ type: string; user: User } | null>(null);
  const [assignModal, setAssignModal] = useState<User | null>(null);

  useEffect(() => {
    Promise.all([userService.getByRole('MODEL'), userService.getByRole('MANAGER')]).then(([m, mgrs]) => {
      setModels(m);
      setManagers(mgrs);
      setLoading(false);
    });
  }, []);

  const handleAction = async () => {
    if (!action) return;
    if (action.type === 'verify') {
      await userService.setVerified(action.user.id, !action.user.verified);
      setModels((prev) => prev.map((u) => (u.id === action.user.id ? { ...u, verified: !action.user.verified } : u)));
      toast(`Model ${action.user.verified ? 'un' : ''}verified`);
    } else {
      const newStatus = action.type === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
      await userService.setStatus(action.user.id, newStatus as any);
      setModels((prev) => prev.map((u) => (u.id === action.user.id ? { ...u, status: newStatus as any } : u)));
      toast(`Model ${action.type}ed`);
    }
    setAction(null);
  };

  const handleAssign = async (managerId: string) => {
    if (!assignModal) return;
    await userService.assignManager(assignModal.id, managerId);
    setModels((prev) => prev.map((u) => (u.id === assignModal.id ? { ...u, managerId } : u)));
    toast('Manager assigned successfully');
    setAssignModal(null);
  };

  const managerMap: Record<string, User> = {};
  managers.forEach((m) => { managerMap[m.id] = m; });

  const filtered = models.filter((m) => {
    const matchQuery = !query || m.name.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
    return matchQuery && matchStatus;
  });

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Models" subtitle="Manage all platform creators" />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models..." className="pl-10" />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="ALL">All Statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
        </Select>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No models found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'name', label: 'Model', render: (m: User) => <div className="flex items-center gap-3"><Avatar src={m.avatar} size="sm" /><div className="flex items-center gap-1"><p className="font-semibold text-sm">{m.name}</p>{m.verified && <BadgeCheck className="w-4 h-4 text-brand-500" />}</div></div> },
              { key: 'manager', label: 'Manager', render: (m: User) => <span className="text-sm text-ink-600">{m.managerId ? managerMap[m.managerId]?.name || '—' : 'Unassigned'}</span> },
              { key: 'subscribers', label: 'Subscribers', render: (m: User) => <span className="text-sm font-semibold">{(m.subscriberCount || 0).toLocaleString()}</span> },
              { key: 'revenue', label: 'Revenue', render: (m: User) => <span className="text-sm font-semibold">{formatCurrency(m.revenue || 0)}</span> },
              { key: 'status', label: 'Status', render: (m: User) => <StatusBadge status={m.status} /> },
              { key: 'actions', label: 'Actions', render: (m: User) => (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(m)}><Eye className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setAssignModal(m)} title="Assign Manager"><UserCog className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'verify', user: m })} className={m.verified ? 'text-brand-600' : 'text-ink-400'}><BadgeCheck className="w-3.5 h-3.5" /></Button>
                  {m.status === 'ACTIVE' ? <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'suspend', user: m })} className="text-warning-600"><Ban className="w-3.5 h-3.5" /></Button> : <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'activate', user: m })} className="text-success-600"><Check className="w-3.5 h-3.5" /></Button>}
                </div>
              )},
            ]}
            data={filtered}
            rowKey={(m) => m.id}
          />
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Model Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selected.avatar} size="xl" />
              <div><h3 className="font-display font-bold text-lg">{selected.name}</h3><p className="text-sm text-ink-500">@{selected.username}</p><div className="flex items-center gap-2 mt-1"><StatusBadge status={selected.status} />{selected.verified && <Badge tone="brand">Verified</Badge>}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Subscribers</p><p className="text-lg font-bold">{(selected.subscriberCount || 0).toLocaleString()}</p></div>
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Revenue</p><p className="text-lg font-bold">{formatCurrency(selected.revenue || 0)}</p></div>
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Manager</p><p className="text-sm font-semibold">{selected.managerId ? managerMap[selected.managerId]?.name || '—' : 'Unassigned'}</p></div>
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Joined</p><p className="text-sm font-semibold">{formatDate(selected.createdAt)}</p></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Manager" size="sm">
        <div className="space-y-2">
          {managers.map((m) => (
            <button key={m.id} onClick={() => handleAssign(m.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:border-brand-300 hover:bg-brand-50/50 transition-all text-left">
              <Avatar src={m.avatar} size="sm" />
              <div><p className="text-sm font-semibold">{m.name}</p><p className="text-xs text-ink-500">{m.email}</p></div>
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog open={!!action} onClose={() => setAction(null)} onConfirm={handleAction} title={action?.type === 'verify' ? 'Verify Model' : action?.type === 'activate' ? 'Activate Model' : 'Suspend Model'} message={`Are you sure you want to ${action?.type} ${action?.user.name}?`} confirmLabel={action?.type === 'activate' ? 'Activate' : action?.type === 'verify' ? 'Verify' : 'Suspend'} danger={action?.type === 'suspend'} />
    </DashboardShell>
  );
}
