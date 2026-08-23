import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { managerService, subscriptionService, userService } from '@/services';
import type { User, Subscription } from '@/types';
import { formatDate, formatCurrency } from '@/lib/format';
import { managerNavItems } from '@/lib/nav';

export function ManagerSubscribers() {
  const { user } = useAuth();
  const [models, setModels] = useState<User[]>([]);
  const [allSubs, setAllSubs] = useState<Subscription[]>([]);
  const [subscribers, setSubscribers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterModel, setFilterModel] = useState('ALL');

  useEffect(() => {
    if (!user) return;
    managerService.getModelsByManager(user.id).then(async (m) => {
      setModels(m);
      const subs = await Promise.all(m.map((model) => subscriptionService.getByModel(model.id)));
      const flat = subs.flat();
      setAllSubs(flat);
      const ids = [...new Set(flat.map((s) => s.userId))];
      const users = await Promise.all(ids.map((id) => userService.getById(id)));
      const map: Record<string, User> = {};
      users.forEach((u) => { if (u) map[u.id] = u; });
      setSubscribers(map);
      setLoading(false);
    });
  }, [user]);

  const filtered = allSubs.filter((s) => {
    const matchModel = filterModel === 'ALL' || s.modelId === filterModel;
    const subUser = subscribers[s.userId];
    const matchQuery = !query || (subUser?.name.toLowerCase().includes(query.toLowerCase()));
    return matchModel && matchQuery;
  });

  const modelMap: Record<string, User> = {};
  models.forEach((m) => { modelMap[m.id] = m; });

  return (
    <DashboardShell navItems={managerNavItems} brandColor="accent">
      <PageHeader title="Subscribers" subtitle="All subscribers across your models" />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subscribers..." className="pl-10" />
        </div>
        <Select value={filterModel} onChange={(e) => setFilterModel(e.target.value)} className="w-auto">
          <option value="ALL">All Models</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No subscribers found" />
      ) : (
        <div className="space-y-2">
          {filtered.map((sub) => {
            const subUser = subscribers[sub.userId];
            const model = modelMap[sub.modelId];
            return (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={subUser?.avatar || ''} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-ink-900">{subUser?.name || 'Unknown'}</p>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-xs text-ink-500">@{subUser?.username} → {model?.name}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-ink-900">{formatCurrency(sub.price)}</p>
                    <p className="text-xs text-ink-500">Since {formatDate(sub.startedAt)}</p>
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
