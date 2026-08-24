import { useState, useEffect } from 'react';
import { RoleShell } from '@/components/layout/RoleShell';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Tabs, useTabs } from '@/components/ui/Tabs';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { subscriptionService, userService } from '@/services';
import type { Subscription, User } from '@/types';
import { formatDate, formatCurrency } from '@/lib/format';
import { Calendar, CreditCard, X } from 'lucide-react';

export function UserSubscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [models, setModels] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const { active, setActive } = useTabs('active');

  useEffect(() => {
    if (!user) return;
    subscriptionService.getByUser(user.id).then(async (s) => {
      setSubs(s);
      const ids = [...new Set(s.map((sub) => sub.modelId))];
      const modelData = await Promise.all(ids.map((id) => userService.getById(id)));
      const map: Record<string, User> = {};
      modelData.forEach((m) => { if (m) map[m.id] = m; });
      setModels(map);
      setLoading(false);
    });
  }, [user]);

  const handleCancel = async (id: string) => {
    await subscriptionService.cancel(id);
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'CANCELLED' } : s)));
    toast('Subscription cancelled', 'info');
  };

  const filtered = subs.filter((s) => active === 'active' ? s.status === 'ACTIVE' : s.status !== 'ACTIVE');

  return (
    <RoleShell>
      <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">My Subscriptions</h1>
      <p className="text-ink-500 mb-6">Manage your active and past subscriptions</p>

      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'active', label: 'Active', count: subs.filter((s) => s.status === 'ACTIVE').length },
            { id: 'past', label: 'Past', count: subs.filter((s) => s.status !== 'ACTIVE').length },
          ]}
          active={active}
          onChange={setActive}
          variant="pills"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title={active === 'active' ? 'No active subscriptions' : 'No past subscriptions'} description={active === 'active' ? 'Explore creators and subscribe to support them' : undefined} />
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => {
            const model = models[sub.modelId];
            return (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar src={model?.avatar || ''} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink-900">{model?.name || 'Unknown'}</h3>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-sm text-ink-500">@{model?.username}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink-500">
                      <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> {formatCurrency(sub.price)}/{sub.plan.toLowerCase()}</span>
                      {sub.status === 'ACTIVE' && (
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Renews {formatDate(sub.renewsAt)}</span>
                      )}
                      {sub.cancelledAt && <span>Cancelled {formatDate(sub.cancelledAt)}</span>}
                    </div>
                  </div>
                  {sub.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" onClick={() => handleCancel(sub.id)}>
                      <X className="w-4 h-4" /> Cancel
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </RoleShell>
  );
}
