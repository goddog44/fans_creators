import { useEffect, useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, BadgeCheck, Wallet, DollarSign, Flag, TrendingUp } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services';
import type { Notification } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

const iconMap: Record<string, any> = {
  NEW_REPORT: Flag,
  VERIFICATION: BadgeCheck,
  TRANSACTION_ISSUE: DollarSign,
  PAYOUT_ATTENTION: Wallet,
  NEW_MODEL: Bell,
  PERFORMANCE_ALERT: TrendingUp,
};

export function AdminNotifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    notificationService.getByUser(user.id).then((n) => {
      setNotifs(n);
      setLoading(false);
    });
  }, [user]);

  const handleMarkAll = async () => {
    if (!user) return;
    await notificationService.markAllRead(user.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markRead(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Notifications" subtitle={`${notifs.filter((n) => !n.read).length} unread`} action={notifs.some((n) => !n.read) ? <Button variant="outline" size="sm" onClick={handleMarkAll}><CheckCheck className="w-4 h-4" /> Mark all read</Button> : undefined} />

      {loading ? (
        <LoadingState />
      ) : notifs.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const Icon = iconMap[n.type] || Bell;
            return (
              <button key={n.id} onClick={() => handleMarkRead(n.id)} className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${n.read ? 'bg-white border-ink-200/60' : 'bg-ink-50 border-ink-300'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-ink-100 text-ink-500' : 'bg-ink-900 text-white'}`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-ink-900">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-ink-900 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-ink-600 mt-0.5">{n.body}</p>
                  <p className="text-xs text-ink-400 mt-1">{formatTimeAgo(n.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
