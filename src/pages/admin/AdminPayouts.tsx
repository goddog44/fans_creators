import { useEffect, useState } from 'react';
import { Search, Check, X, Wallet } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { payoutService, userService } from '@/services';
import type { Payout, User } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminPayouts() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [action, setAction] = useState<{ type: string; payout: Payout } | null>(null);

  useEffect(() => {
    Promise.all([payoutService.getAll(), userService.getAll()]).then(([p, u]) => {
      setPayouts(p);
      const map: Record<string, User> = {};
      u.forEach((user) => { map[user.id] = user; });
      setUsers(map);
      setLoading(false);
    });
  }, []);

  const handleAction = async () => {
    if (!action) return;
    const newStatus = action.type === 'approve' ? 'COMPLETED' : 'FAILED';
    await payoutService.setStatus(action.payout.id, newStatus as any);
    setPayouts((prev) => prev.map((p) => (p.id === action.payout.id ? { ...p, status: newStatus as any } : p)));
    toast(`Payout ${action.type === 'approve' ? 'approved' : 'rejected'}`);
    setAction(null);
  };

  const filtered = payouts.filter((p) => {
    const matchQuery = !query || (users[p.userId]?.name.toLowerCase().includes(query.toLowerCase()) || p.id.includes(query));
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const totalPending = payouts.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);
  const totalCompleted = payouts.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Payouts" subtitle="Manage creator payout requests" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Pending Payouts" value={formatCurrency(totalPending)} icon={<Wallet className="w-5 h-5" />} tone="warning" />
        <StatCard label="Completed Payouts" value={formatCurrency(totalCompleted)} icon={<Wallet className="w-5 h-5" />} tone="success" />
        <StatCard label="Total Payouts" value={payouts.length} icon={<Wallet className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search payouts..." className="pl-10" />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="ALL">All Statuses</option><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="FAILED">Failed</option>
        </Select>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No payouts found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'id', label: 'ID', render: (p: Payout) => <span className="text-xs font-mono text-ink-500">{p.id}</span> },
              { key: 'user', label: 'User', render: (p: Payout) => <span className="text-sm font-medium">{users[p.userId]?.name || '—'}</span> },
              { key: 'amount', label: 'Amount', render: (p: Payout) => <span className="text-sm font-semibold">{formatCurrency(p.amount)}</span> },
              { key: 'method', label: 'Method', render: (p: Payout) => <span className="text-sm">{p.method}</span> },
              { key: 'status', label: 'Status', render: (p: Payout) => <StatusBadge status={p.status} /> },
              { key: 'date', label: 'Date', render: (p: Payout) => <span className="text-sm text-ink-500">{formatDateTime(p.createdAt)}</span> },
              { key: 'actions', label: 'Actions', render: (p: Payout) => (
                p.status === 'PENDING' ? (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="text-success-600" onClick={() => setAction({ type: 'approve', payout: p })}><Check className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => setAction({ type: 'reject', payout: p })}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ) : <span className="text-xs text-ink-400">—</span>
              )},
            ]}
            data={filtered}
            rowKey={(p) => p.id}
          />
        </Card>
      )}

      <ConfirmDialog open={!!action} onClose={() => setAction(null)} onConfirm={handleAction} title={action?.type === 'approve' ? 'Approve Payout' : 'Reject Payout'} message={`Are you sure you want to ${action?.type} this payout of ${action ? formatCurrency(action.payout.amount) : ''}?`} confirmLabel={action?.type === 'approve' ? 'Approve' : 'Reject'} danger={action?.type !== 'approve'} />
    </DashboardShell>
  );
}
