import { useEffect, useState } from 'react';
import { DollarSign, Users, TrendingUp, Gift, Lock, BarChart3 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { managerService } from '@/services';
import type { User } from '@/types';
import { formatCurrency } from '@/lib/format';
import { managerNavItems } from '@/lib/nav';

export function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [models, setModels] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([managerService.getManagerStats(user.id), managerService.getModelsByManager(user.id)]).then(([s, m]) => {
      setStats(s);
      setModels(m);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <DashboardShell navItems={managerNavItems} brandColor="accent"><LoadingState /></DashboardShell>;

  return (
    <DashboardShell navItems={managerNavItems} brandColor="accent">
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Models" value={stats.totalModels} icon={<Users className="w-5 h-5" />} tone="accent" />
        <StatCard label="Total Subscribers" value={stats.totalSubscribers} icon={<Users className="w-5 h-5" />} tone="brand" trend={{ value: `+${stats.newSubscribers}`, up: true }} />
        <StatCard label="Team Revenue" value={formatCurrency(stats.revenue)} icon={<DollarSign className="w-5 h-5" />} tone="success" trend={{ value: '+12%', up: true }} />
        <StatCard label="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue)} icon={<TrendingUp className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="PPV Revenue" value={formatCurrency(stats.ppvRevenue)} icon={<Lock className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Tips" value={formatCurrency(stats.tipRevenue)} icon={<Gift className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Subscriptions" value={formatCurrency(stats.subscriptionRevenue)} icon={<DollarSign className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Model Performance</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {models.map((model) => {
                const maxRev = Math.max(...models.map((m) => m.revenue || 0), 1);
                const pct = ((model.revenue || 0) / maxRev) * 100;
                return (
                  <div key={model.id} className="flex items-center gap-3">
                    <Avatar src={model.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{model.name}</p>
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink-700 flex-shrink-0">{formatCurrency(model.revenue || 0)}</span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-2 h-40">
              {[30, 45, 35, 60, 50, 70, 55, 80, 65, 90, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-accent-400 to-accent-600 rounded-t-lg" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-ink-400">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => <span key={m}>{m}</span>)}
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
