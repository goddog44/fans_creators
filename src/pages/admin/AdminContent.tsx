import { useEffect, useState } from 'react';
import { Search, Eye, Check, X, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { contentService, userService } from '@/services';
import type { Post, User, ContentStatus } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminContent() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [models, setModels] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selected, setSelected] = useState<Post | null>(null);

  useEffect(() => {
    Promise.all([contentService.getPosts(), userService.getByRole('MODEL')]).then(([p, m]) => {
      setPosts(p);
      const map: Record<string, User> = {};
      m.forEach((u) => { map[u.id] = u; });
      setModels(map);
      setLoading(false);
    });
  }, []);

  const handleStatus = async (id: string, status: ContentStatus) => {
    await contentService.setStatus(id, status);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    toast(`Content ${status.toLowerCase()}`);
  };

  const handleDelete = async (id: string) => {
    await contentService.deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast('Content deleted', 'info');
  };

  const filtered = posts.filter((p) => {
    const matchQuery = !query || p.text.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchQuery && matchStatus;
  });

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Content" subtitle="Moderate all platform content" />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content..." className="pl-10" />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="ALL">All Statuses</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="REVIEW">Review</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="REMOVED">Removed</option>
        </Select>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No content found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'text', label: 'Content', render: (p: Post) => <div className="max-w-xs"><p className="text-sm font-medium truncate">{p.text}</p><p className="text-xs text-ink-500">{models[p.modelId]?.name} · {formatTimeAgo(p.createdAt)}</p></div> },
              { key: 'visibility', label: 'Type', render: (p: Post) => <Badge tone="neutral">{p.visibility}</Badge> },
              { key: 'status', label: 'Status', render: (p: Post) => <StatusBadge status={p.status} /> },
              { key: 'likes', label: 'Likes', render: (p: Post) => <span className="text-sm">{p.likes}</span> },
              { key: 'actions', label: 'Actions', render: (p: Post) => (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(p)}><Eye className="w-3.5 h-3.5" /></Button>
                  {p.status !== 'APPROVED' && p.status !== 'PUBLISHED' && <Button size="sm" variant="ghost" className="text-success-600" onClick={() => handleStatus(p.id, 'APPROVED')}><Check className="w-3.5 h-3.5" /></Button>}
                  {p.status !== 'REJECTED' && p.status !== 'REMOVED' && <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => handleStatus(p.id, 'REJECTED')}><X className="w-3.5 h-3.5" /></Button>}
                  <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              )},
            ]}
            data={filtered}
            rowKey={(p) => p.id}
          />
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Content Preview" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar src={models[selected.modelId]?.avatar || ''} size="md" />
              <div><p className="font-semibold text-sm">{models[selected.modelId]?.name}</p><p className="text-xs text-ink-500">{formatTimeAgo(selected.createdAt)}</p></div>
              <div className="ml-auto flex items-center gap-2"><StatusBadge status={selected.status} /><Badge tone="neutral">{selected.visibility}</Badge></div>
            </div>
            <p className="text-sm text-ink-800">{selected.text}</p>
            {selected.media && selected.media.length > 0 && <img src={selected.media[0].url} alt="" className="w-full rounded-xl" />}
            <div className="flex items-center gap-4 text-sm text-ink-500">
              <span>{selected.likes} likes</span><span>{selected.comments.length} comments</span><span>{selected.bookmarks} bookmarks</span>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
