import { useEffect, useState } from 'react';
import { Search, Eye, Ban, Check, X } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { userService, subscriptionService, transactionService } from '@/services';
import type { User, Subscription, Transaction } from '@/types';
import { formatDate, formatCurrency } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSubs, setUserSubs] = useState<Subscription[]>([]);
  const [userTxns, setUserTxns] = useState<Transaction[]>([]);
  const [action, setAction] = useState<{ type: string; user: User } | null>(null);

  useEffect(() => {
    userService.getAll().then((u) => {
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const openUser = async (user: User) => {
    setSelectedUser(user);
    const [subs, txns] = await Promise.all([subscriptionService.getByUser(user.id), transactionService.getByUser(user.id)]);
    setUserSubs(subs);
    setUserTxns(txns);
  };

  const handleAction = async () => {
    if (!action) return;
    const newStatus = action.type === 'suspend' ? 'SUSPENDED' : action.type === 'block' ? 'BLOCKED' : 'ACTIVE';
    await userService.setStatus(action.user.id, newStatus as any);
    setUsers((prev) => prev.map((u) => (u.id === action.user.id ? { ...u, status: newStatus as any } : u)));
    toast(`User ${action.type}ed successfully`);
    setAction(null);
  };

  const filtered = users.filter((u) => {
    const matchQuery = !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchQuery && matchRole && matchStatus;
  });

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Users" subtitle="Manage all platform users" />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users..." className="pl-10" />
        </div>
        <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-auto">
          <option value="ALL">All Roles</option><option value="ADMIN">Admin</option><option value="MANAGER">Manager</option><option value="MODEL">Model</option><option value="USER">User</option>
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="ALL">All Statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="BLOCKED">Blocked</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <Card>
          <Table
            columns={[
              { key: 'name', label: 'User', render: (u: User) => (
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatar} size="sm" />
                  <div><p className="font-semibold text-sm">{u.name}</p><p className="text-xs text-ink-500">{u.email}</p></div>
                </div>
              )},
              { key: 'role', label: 'Role', render: (u: User) => <span className="text-sm font-medium">{u.role}</span> },
              { key: 'status', label: 'Status', render: (u: User) => <StatusBadge status={u.status} /> },
              { key: 'createdAt', label: 'Joined', render: (u: User) => <span className="text-sm text-ink-500">{formatDate(u.createdAt)}</span> },
              { key: 'actions', label: 'Actions', render: (u: User) => (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openUser(u)}><Eye className="w-3.5 h-3.5" /></Button>
                  {u.status === 'ACTIVE' ? (
                    <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'suspend', user: u })} className="text-warning-600"><Ban className="w-3.5 h-3.5" /></Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'activate', user: u })} className="text-success-600"><Check className="w-3.5 h-3.5" /></Button>
                  )}
                </div>
              )},
            ]}
            data={filtered}
            rowKey={(u) => u.id}
            onRowClick={(u) => openUser(u)}
          />
        </Card>
      )}

      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" size="lg">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selectedUser.avatar} size="xl" />
              <div>
                <h3 className="font-display font-bold text-lg text-ink-900">{selectedUser.name}</h3>
                <p className="text-sm text-ink-500">@{selectedUser.username} · {selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1"><StatusBadge status={selectedUser.status} /><span className="text-xs text-ink-500">{selectedUser.role}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Joined</p><p className="text-sm font-semibold">{formatDate(selectedUser.createdAt)}</p></div>
              <div className="p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-500">Last Active</p><p className="text-sm font-semibold">{formatDate(selectedUser.lastActive)}</p></div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-ink-900 mb-2">Subscriptions ({userSubs.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {userSubs.map((s) => <div key={s.id} className="flex justify-between text-sm py-1"><span className="text-ink-600">Model: {s.modelId}</span><span className="font-semibold">{formatCurrency(s.price)}</span></div>)}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-ink-900 mb-2">Transactions ({userTxns.length})</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {userTxns.map((t) => <div key={t.id} className="flex justify-between text-sm py-1"><span className="text-ink-600">{t.description}</span><span className="font-semibold">{formatCurrency(t.amount)}</span></div>)}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!action} onClose={() => setAction(null)} onConfirm={handleAction} title={`${action?.type === 'activate' ? 'Activate' : action?.type === 'block' ? 'Block' : 'Suspend'} User`} message={`Are you sure you want to ${action?.type} ${action?.user.name}?`} confirmLabel={action?.type === 'activate' ? 'Activate' : action?.type === 'block' ? 'Block' : 'Suspend'} danger={action?.type !== 'activate'} />
    </DashboardShell>
  );
}
