import { useEffect, useState } from 'react';
import { BarChart3, Eye, TrendingUp, Users, Star } from 'lucide-react';
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

export function ManagerAnalytics() {
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
      <PageHeader title="Analytics" subtitle="Team performance insights" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Subscribers" value={stats.totalSubscribers} icon={<Users className="w-5 h-5" />} tone="accent" trend={{ value: '+8%', up: true }} />
        <StatCard label="New Subscribers" value={stats.newSubscribers} icon={<TrendingUp className="w-5 h-5" />} tone="brand" />
        <StatCard label="Avg Engagement" value={`${models.length ? (models.reduce((s, m) => s + (m.engagement || 0), 0) / models.length).toFixed(1) : 0}%`} icon={<Star className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Total Views" value="48.2K" icon={<Eye className="w-5 h-5" />} tone="neutral" trend={{ value: '+15%', up: true }} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Subscriber Growth</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-2 h-40">
              {[20, 30, 25, 45, 40, 60, 55, 70, 65, 85, 80, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-accent-400 to-accent-600 rounded-t-lg" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-ink-400">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => <span key={m}>{m}</span>)}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Model Comparison</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {models.map((model) => (
                <div key={model.id} className="flex items-center gap-3">
                  <Avatar src={model.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{model.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-500 rounded-full" style={{ width: `${((model.subscriberCount || 0) / Math.max(...models.map((m) => m.subscriberCount || 0), 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-ink-500 flex-shrink-0">{(model.subscriberCount || 0).toLocaleString()} subs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
