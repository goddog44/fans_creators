import { useEffect, useState } from 'react';
import { Search, Users, DollarSign, Star } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { managerService } from '@/services';
import type { User } from '@/types';
import { formatCurrency, formatTimeAgo } from '@/lib/format';
import { managerNavItems } from '@/lib/nav';

export function ManagerModels() {
  const { user } = useAuth();
  const [models, setModels] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    managerService.getModelsByManager(user.id).then((m) => {
      setModels(m);
      setLoading(false);
    });
  }, [user]);

  const filtered = models.filter((m) => !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.username.toLowerCase().includes(query.toLowerCase()));

  return (
    <DashboardShell navItems={managerNavItems} brandColor="accent">
      <PageHeader title="My Models" subtitle="Manage your assigned creators" />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search models..." className="pl-10" />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No models assigned yet" description="Models assigned to you will appear here" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((model) => (
            <Card key={model.id} hover className="overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-accent-100 to-accent-200 relative">
                <img src={model.cover || `https://picsum.photos/seed/${model.id}/600/200`} alt="" className="w-full h-full object-cover" />
              </div>
              <CardBody className="-mt-10">
                <Avatar src={model.avatar} size="xl" className="border-4 border-white rounded-full" />
                <div className="mt-3">
                  <h3 className="font-display font-bold text-ink-900">{model.name}</h3>
                  <p className="text-sm text-ink-500">@{model.username}</p>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {model.subscriberCount?.toLocaleString() || 0}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {formatCurrency(model.revenue || 0)}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {model.engagement || 0}%</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <StatusBadge status={model.status} />
                  <span className="text-xs text-ink-400">Active {formatTimeAgo(model.lastActive)}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
