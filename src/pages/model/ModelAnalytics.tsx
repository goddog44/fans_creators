import { useEffect, useState } from 'react';
import { BarChart3, Eye, Heart, MessageCircle, Bookmark, DollarSign } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { modelService, contentService } from '@/services';
import type { Post } from '@/types';
import { modelNavItems as navItems } from '@/lib/nav';

export function ModelAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([modelService.getStats(user.id), contentService.getPostsByModel(user.id)]).then(([s, p]) => {
      setStats(s);
      setPosts(p);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <DashboardShell navItems={navItems}><LoadingState /></DashboardShell>;

  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments.length, 0);
  const totalBookmarks = posts.reduce((s, p) => s + p.bookmarks, 0);
  const topPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 5);

  return (
    <DashboardShell navItems={navItems}>
      <PageHeader title="Analytics" subtitle="Insights into your performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Views" value="12.4K" icon={<Eye className="w-5 h-5" />} tone="accent" trend={{ value: '+8%', up: true }} />
        <StatCard label="Total Likes" value={totalLikes.toLocaleString()} icon={<Heart className="w-5 h-5" />} tone="brand" trend={{ value: '+15%', up: true }} />
        <StatCard label="Comments" value={totalComments} icon={<MessageCircle className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Bookmarks" value={totalBookmarks} icon={<Bookmark className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
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
          <CardHeader><CardTitle>Revenue by Type</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-4">
              {[
                { label: 'Subscriptions', value: stats.subscriptionRevenue, color: 'bg-brand-500' },
                { label: 'PPV Content', value: stats.ppvRevenue, color: 'bg-accent-500' },
                { label: 'Tips', value: stats.tipRevenue, color: 'bg-success-500' },
              ].map((item) => {
                const total = stats.subscriptionRevenue + stats.ppvRevenue + stats.tipRevenue || 1;
                const pct = (item.value / total) * 100;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink-600">{item.label}</span>
                      <span className="font-semibold text-ink-900">${item.value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Performing Posts</CardTitle></CardHeader>
        <CardBody>
          {topPosts.length === 0 ? (
            <p className="text-sm text-ink-500">No posts yet</p>
          ) : (
            <div className="space-y-3">
              {topPosts.map((post, i) => (
                <div key={post.id} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-ink-300 w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{post.text}</p>
                    <div className="flex items-center gap-4 text-xs text-ink-500">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {post.comments.length}</span>
                      <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> {post.bookmarks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </DashboardShell>
  );
}
