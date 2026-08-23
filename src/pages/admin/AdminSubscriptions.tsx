import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { subscriptionService, userService } from '@/services';
import type { Subscription, User } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([subscriptionService.getAll(), userService.getAll()]).then(([s, u]) => {
      setSubs(s);
      const map: Record<string, User> = {};
      u.forEach((user) => { map[user.id] = user; });
      setUsers(map);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Subscriptions" subtitle="All platform subscriptions" />

      {loading ? <LoadingState /> : subs.length === 0 ? <EmptyState title="No subscriptions found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'id', label: 'ID', render: (s: Subscription) => <span className="text-xs text-ink-500 font-mono">{s.id}</span> },
              { key: 'user', label: 'User', render: (s: Subscription) => <span className="text-sm font-medium">{users[s.userId]?.name || '—'}</span> },
              { key: 'model', label: 'Model', render: (s: Subscription) => <span className="text-sm font-medium">{users[s.modelId]?.name || '—'}</span> },
              { key: 'plan', label: 'Plan', render: (s: Subscription) => <span className="text-sm capitalize">{s.plan.toLowerCase()}</span> },
              { key: 'price', label: 'Price', render: (s: Subscription) => <span className="text-sm font-semibold">{formatCurrency(s.price)}</span> },
              { key: 'status', label: 'Status', render: (s: Subscription) => <StatusBadge status={s.status} /> },
              { key: 'startedAt', label: 'Started', render: (s: Subscription) => <span className="text-sm text-ink-500">{formatDate(s.startedAt)}</span> },
              { key: 'renewsAt', label: 'Renews', render: (s: Subscription) => <span className="text-sm text-ink-500">{formatDate(s.renewsAt)}</span> },
            ]}
            data={subs}
            rowKey={(s) => s.id}
          />
        </Card>
      )}
    </DashboardShell>
  );
}
