import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Lock, Gift, CreditCard } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { managerService, transactionService } from '@/services';
import type { User, Transaction } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { managerNavItems } from '@/lib/nav';

export function ManagerRevenue() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [models, setModels] = useState<User[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    managerService.getModelsByManager(user.id).then(async (m) => {
      setModels(m);
      const stats = await managerService.getManagerStats(user.id);
      setStats(stats);
      const allTxns = await Promise.all(m.map((model) => transactionService.getByModel(model.id)));
      setTxns(allTxns.flat());
      setLoading(false);
    });
  }, [user]);

  if (loading) return <DashboardShell navItems={managerNavItems} brandColor="accent"><LoadingState /></DashboardShell>;

  return (
    <DashboardShell navItems={managerNavItems} brandColor="accent">
      <PageHeader title="Revenue" subtitle="Team financial performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={formatCurrency(stats.revenue)} icon={<DollarSign className="w-5 h-5" />} tone="success" trend={{ value: '+12%', up: true }} />
        <StatCard label="Monthly" value={formatCurrency(stats.monthlyRevenue)} icon={<TrendingUp className="w-5 h-5" />} tone="accent" />
        <StatCard label="Subscriptions" value={formatCurrency(stats.subscriptionRevenue)} icon={<CreditCard className="w-5 h-5" />} tone="brand" />
        <StatCard label="PPV + Tips" value={formatCurrency(stats.ppvRevenue + stats.tipRevenue)} icon={<Lock className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue by Model</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {models.map((model) => (
                <div key={model.id} className="flex items-center gap-3">
                  <Avatar src={model.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{model.name}</p>
                    <div className="h-2 bg-ink-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full" style={{ width: `${((model.revenue || 0) / Math.max(...models.map((m) => m.revenue || 0), 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-700 flex-shrink-0">{formatCurrency(model.revenue || 0)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
              {txns.slice(0, 15).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{t.description}</p>
                    <p className="text-xs text-ink-500">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
