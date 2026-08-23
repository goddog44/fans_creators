import { useEffect, useState } from 'react';
import { Check, X, Eye, Trash2, FileText } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { managerService, contentService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { Post, User, ContentStatus } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { managerNavItems } from '@/lib/nav';

export function ManagerContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [models, setModels] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (!user) return;
    managerService.getModelsByManager(user.id).then(async (m) => {
      setModels(m);
      const allPosts = await Promise.all(m.map((model) => contentService.getPostsByModel(model.id)));
      setPosts(allPosts.flat());
      setLoading(false);
    });
  }, [user]);

  const handleStatus = async (id: string, status: ContentStatus) => {
    await contentService.setStatus(id, status);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    toast(`Post ${status.toLowerCase()}`);
  };

  const handleDelete = async (id: string) => {
    await contentService.deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast('Post deleted', 'info');
  };

  const filtered = posts.filter((p) => {
    const matchModel = filterModel === 'ALL' || p.modelId === filterModel;
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchModel && matchStatus;
  });

  const modelMap: Record<string, User> = {};
  models.forEach((m) => { modelMap[m.id] = m; });

  return (
    <DashboardShell navItems={managerNavItems} brandColor="accent">
      <PageHeader title="Content" subtitle="Review and manage content from your models" />

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={filterModel} onChange={(e) => setFilterModel(e.target.value)} className="w-auto">
          <option value="ALL">All Models</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="APPROVED">Approved</option>
          <option value="PUBLISHED">Published</option>
        </Select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="No content found" description="Content from your models will appear here" />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const model = modelMap[post.modelId];
            return (
              <Card key={post.id} className="p-4">
                <div className="flex items-start gap-3">
                  {post.media && post.media.length > 0 ? (
                    <img src={post.media[0].thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-ink-300" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar src={model?.avatar || ''} size="xs" />
                      <span className="text-sm font-semibold text-ink-900">{model?.name}</span>
                      <StatusBadge status={post.status} />
                      <Badge tone="neutral">{post.visibility}</Badge>
                    </div>
                    <p className="text-sm text-ink-700 line-clamp-2">{post.text}</p>
                    <p className="text-xs text-ink-400 mt-1">{formatTimeAgo(post.createdAt)} · {post.likes} likes</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {post.status === 'REVIEW' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleStatus(post.id, 'APPROVED')}><Check className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="danger" onClick={() => handleStatus(post.id, 'REJECTED')}><X className="w-3.5 h-3.5" /></Button>
                      </>
                    )}
                    {post.status === 'APPROVED' && <Button size="sm" onClick={() => handleStatus(post.id, 'PUBLISHED')}>Publish</Button>}
                    <Button size="sm" variant="ghost"><Eye className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(post.id)} className="text-danger-600"><Trash2 className="w-3.5 h-3.5" /></Button>
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
