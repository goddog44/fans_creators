import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Users, MessageSquare, DollarSign, BarChart3, Bell, User, Settings } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StatCard, PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { modelService, contentService, subscriptionService } from '@/services';
import type { Post, Subscription } from '@/types';
import { formatCurrency, formatTimeAgo } from '@/lib/format';
import { modelNavItems as navItems } from '@/lib/nav';

export function ModelDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      modelService.getStats(user.id),
      contentService.getPostsByModel(user.id),
      subscriptionService.getByModel(user.id),
    ]).then(([s, p, sub]) => {
      setStats(s);
      setPosts(p);
      setSubs(sub);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <DashboardShell navItems={navItems}><LoadingState /></DashboardShell>;

  const recentPosts = posts.slice(0, 5);

  return (
    <DashboardShell navItems={navItems}>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Earnings" value={formatCurrency(stats.totalEarnings)} icon={<DollarSign className="w-5 h-5" />} tone="success" trend={{ value: '+12%', up: true }} />
        <StatCard label="Available Balance" value={formatCurrency(stats.availableBalance)} icon={<DollarSign className="w-5 h-5" />} tone="brand" />
        <StatCard label="Pending Balance" value={formatCurrency(stats.pendingBalance)} icon={<DollarSign className="w-5 h-5" />} tone="warning" />
        <StatCard label="Subscribers" value={stats.subscribers} icon={<Users className="w-5 h-5" />} tone="accent" trend={{ value: `+${stats.newSubscribers}`, up: true }} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="PPV Revenue" value={formatCurrency(stats.ppvRevenue)} icon={<DollarSign className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Tips" value={formatCurrency(stats.tipRevenue)} icon={<DollarSign className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Engagement" value={`${stats.engagement}%`} icon={<BarChart3 className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <Card>
          <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-2 h-40">
              {[40, 55, 35, 70, 50, 80, 60, 90, 75, 95, 85, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-brand-400 to-brand-600 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-ink-400">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent posts */}
        <Card>
          <CardHeader><CardTitle>Recent Posts</CardTitle></CardHeader>
          <CardBody>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-ink-500">No posts yet</p>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-ink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{post.text}</p>
                      <p className="text-xs text-ink-500">{formatTimeAgo(post.createdAt)} · {post.likes} likes</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
