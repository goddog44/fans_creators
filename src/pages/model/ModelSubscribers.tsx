import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, useTabs } from '@/components/ui/Tabs';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { subscriptionService, userService } from '@/services';
import type { Subscription, User } from '@/types';
import { formatDate, formatCurrency } from '@/lib/format';
import { modelNavItems as navItems } from '@/lib/nav';

export function ModelSubscribers() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [subscribers, setSubscribers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const { active, setActive } = useTabs('active');

  useEffect(() => {
    if (!user) return;
    subscriptionService.getByModel(user.id).then(async (s) => {
      setSubs(s);
      const ids = [...new Set(s.map((sub) => sub.userId))];
      const users = await Promise.all(ids.map((id) => userService.getById(id)));
      const map: Record<string, User> = {};
      users.forEach((u) => { if (u) map[u.id] = u; });
      setSubscribers(map);
      setLoading(false);
    });
  }, [user]);

  const filtered = subs.filter((s) => {
    const subUser = subscribers[s.userId];
    const matchesQuery = !query || (subUser?.name.toLowerCase().includes(query.toLowerCase()) || subUser?.username.toLowerCase().includes(query.toLowerCase()));
    const matchesTab = active === 'active' ? s.status === 'ACTIVE' : s.status !== 'ACTIVE';
    return matchesQuery && matchesTab;
  });

  return (
    <DashboardShell navItems={navItems}>
      <PageHeader title="Subscribers" subtitle="Manage your subscriber base" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subscribers..." className="pl-10" />
        </div>
        <Tabs tabs={[{ id: 'active', label: 'Active' }, { id: 'past', label: 'Past' }]} active={active} onChange={setActive} variant="pills" />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No subscribers yet" description="When users subscribe to you, they'll appear here" />
      ) : (
        <div className="space-y-2">
          {filtered.map((sub) => {
            const subUser = subscribers[sub.userId];
            return (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={subUser?.avatar || ''} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-ink-900">{subUser?.name || 'Unknown'}</p>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-xs text-ink-500">@{subUser?.username}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-ink-900">{formatCurrency(sub.price)}</p>
                    <p className="text-xs text-ink-500">{sub.plan.toLowerCase()} · {formatDate(sub.startedAt)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
