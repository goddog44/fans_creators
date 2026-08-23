import { useEffect, useState } from 'react';
import { Search, DollarSign, CreditCard, Gift, Lock, RefreshCw, Wallet } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { transactionService, userService } from '@/services';
import type { Transaction, User } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

const typeIcons: Record<string, any> = { SUBSCRIPTION: CreditCard, PPV: Lock, TIP: Gift, PAYOUT: Wallet, REFUND: RefreshCw, COMMISSION: DollarSign };

export function AdminTransactions() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    Promise.all([transactionService.getAll(), userService.getAll()]).then(([t, u]) => {
      setTxns(t);
      const map: Record<string, User> = {};
      u.forEach((user) => { map[user.id] = user; });
      setUsers(map);
      setLoading(false);
    });
  }, []);

  const filtered = txns.filter((t) => {
    const matchQuery = !query || t.description.toLowerCase().includes(query.toLowerCase()) || t.id.includes(query);
    const matchType = filterType === 'ALL' || t.type === filterType;
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchQuery && matchType && matchStatus;
  });

  const total = txns.filter((t) => t.status === 'COMPLETED' && t.type !== 'PAYOUT').reduce((s, t) => s + t.amount, 0);
  const ppvTotal = txns.filter((t) => t.type === 'PPV' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const tipTotal = txns.filter((t) => t.type === 'TIP' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);
  const subTotal = txns.filter((t) => t.type === 'SUBSCRIPTION' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Transactions" subtitle="All financial transactions" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatCurrency(total)} icon={<DollarSign className="w-5 h-5" />} tone="success" />
        <StatCard label="Subscriptions" value={formatCurrency(subTotal)} icon={<CreditCard className="w-5 h-5" />} tone="brand" />
        <StatCard label="PPV" value={formatCurrency(ppvTotal)} icon={<Lock className="w-5 h-5" />} tone="accent" />
        <StatCard label="Tips" value={formatCurrency(tipTotal)} icon={<Gift className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions..." className="pl-10" />
        </div>
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-auto">
          <option value="ALL">All Types</option><option value="SUBSCRIPTION">Subscription</option><option value="PPV">PPV</option><option value="TIP">Tip</option><option value="PAYOUT">Payout</option><option value="REFUND">Refund</option>
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="ALL">All Statuses</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option>
        </Select>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No transactions found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'id', label: 'ID', render: (t: Transaction) => <span className="text-xs font-mono text-ink-500">{t.id}</span> },
              { key: 'user', label: 'User', render: (t: Transaction) => <span className="text-sm font-medium">{users[t.userId]?.name || '—'}</span> },
              { key: 'type', label: 'Type', render: (t: Transaction) => <span className="text-sm">{t.type}</span> },
              { key: 'amount', label: 'Amount', render: (t: Transaction) => <span className="text-sm font-semibold">{formatCurrency(t.amount)}</span> },
              { key: 'status', label: 'Status', render: (t: Transaction) => <StatusBadge status={t.status} /> },
              { key: 'date', label: 'Date', render: (t: Transaction) => <span className="text-sm text-ink-500">{formatDateTime(t.createdAt)}</span> },
            ]}
            data={filtered}
            rowKey={(t) => t.id}
            onRowClick={(t) => setSelected(t)}
          />
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction Details" size="md">
        {selected && (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-ink-500">ID</span><span className="text-sm font-mono">{selected.id}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">User</span><span className="text-sm font-semibold">{users[selected.userId]?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Model</span><span className="text-sm font-semibold">{selected.modelId ? users[selected.modelId]?.name || '—' : '—'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Type</span><span className="text-sm font-semibold">{selected.type}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Amount</span><span className="text-sm font-bold">{formatCurrency(selected.amount)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Status</span><StatusBadge status={selected.status} /></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Description</span><span className="text-sm text-right">{selected.description}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Date</span><span className="text-sm">{formatDateTime(selected.createdAt)}</span></div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
