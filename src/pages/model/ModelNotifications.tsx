import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, CreditCard, DollarSign, UserPlus, Gift, Lock, CheckCheck, Heart, MessageCircle, UserRound } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services';
import type { Notification } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { modelNavItems } from '@/lib/nav';

const iconMap: Record<string, any> = {
  NEW_MESSAGE: MessageSquare,
  SUBSCRIPTION_CONFIRMED: CreditCard,
  SUBSCRIPTION_RENEWAL: Bell,
  PAYMENT: DollarSign,
  PPV_PURCHASE: Lock,
  NEW_SUBSCRIBER: UserPlus,
  TIP_RECEIVED: Gift,
  PAYOUT: DollarSign,
  FOLLOW: UserRound,
  POST_LIKE: Heart,
  REEL_LIKE: Heart,
  POST_COMMENT: MessageCircle,
  REEL_COMMENT: MessageCircle,
  STORY_REPLY: MessageSquare,
  PPV_RECEIVED: DollarSign,
};

export function ModelNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    notificationService.getByUser(user.id).then((n) => {
      setNotifs(n);
      setLoading(false);
    });
    return notificationService.subscribeToUser(user.id, (notification) => setNotifs((current) => [notification, ...current]));
  }, [user]);

  const handleMarkAll = async () => {
    if (!user) return;
    await notificationService.markAllRead(user.id);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (notification: Notification) => {
    await notificationService.markRead(notification.id);
    setNotifs((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    if (notification.link) navigate(notification.link);
  };

  return (
    <DashboardShell navItems={modelNavItems}>
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
                <button key={n.id} onClick={() => void handleNotificationClick(n)} className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${n.read ? 'bg-white border-ink-200/60' : 'bg-brand-50/50 border-brand-200'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-ink-100 text-ink-500' : 'bg-brand-100 text-brand-600'}`}><Icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-ink-900">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0" />}
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
