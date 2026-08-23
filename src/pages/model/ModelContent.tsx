import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Globe, Users, X, GripVertical } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { contentService } from '@/services';
import type { Post, Visibility, ContentStatus } from '@/types';
import { formatTimeAgo } from '@/lib/format';
import { modelNavItems as navItems } from '@/lib/nav';

export function ModelContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [formData, setFormData] = useState({ text: '', visibility: 'PUBLIC' as Visibility, price: 5, scheduledAt: '' });
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    contentService.getPostsByModel(user.id).then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, [user]);

  const handleCreate = async () => {
    if (!user || !formData.text.trim()) return;
    setUploading(true);
    try {
      const post = await contentService.createPost({
        modelId: user.id,
        text: formData.text,
        visibility: formData.visibility,
        price: formData.visibility === 'PPV' ? formData.price : undefined,
        scheduledAt: formData.scheduledAt || undefined,
        mediaFiles: mediaFiles.map((item) => item.file),
      });
      setPosts((prev) => [post, ...prev]);
      setShowCreate(false);
      setFormData({ text: '', visibility: 'PUBLIC', price: 5, scheduledAt: '' });
      mediaFiles.forEach((item) => URL.revokeObjectURL(item.preview));
      setMediaFiles([]);
      toast('Post created successfully');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create post', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    setMediaFiles((current) => [...current, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaFiles((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const moveMedia = (from: number, to: number) => {
    setMediaFiles((current) => {
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await contentService.deletePost(deleteId);
    setPosts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    toast('Post deleted', 'info');
  };

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    await contentService.setStatus(id, status);
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    toast(`Post marked as ${status}`);
  };

  const filtered = filter === 'ALL' ? posts : posts.filter((p) => p.status === filter);

  const visIcon = (v: string) => v === 'PPV' ? <DollarSign className="w-3.5 h-3.5" /> : v === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />;

  return (
    <DashboardShell navItems={navItems}>
      <PageHeader title="Content" subtitle="Manage your posts and content" action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Post</Button>} />

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {['ALL', 'PUBLISHED', 'DRAFT', 'REVIEW', 'APPROVED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${filter === f ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'}`}>
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title="No posts yet" description="Create your first post to get started" action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Post</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              {post.media && post.media.length > 0 ? (
                <img src={post.media[0].thumbnail || post.media[0].url} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-ink-100 flex items-center justify-center">
                  <span className="text-ink-300 text-sm">No media</span>
                </div>
              )}
              <CardBody>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={post.status} />
                  <Badge tone="neutral">{visIcon(post.visibility)} {post.visibility}</Badge>
                </div>
                <p className="text-sm text-ink-800 line-clamp-2 mb-2">{post.text}</p>
                <div className="flex items-center gap-3 text-xs text-ink-500 mb-3">
                  <span>{post.likes} likes</span>
                  <span>{post.comments.length} comments</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {post.status === 'DRAFT' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(post.id, 'REVIEW')}>Submit Review</Button>}
                  {post.status === 'REVIEW' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(post.id, 'PUBLISHED')}>Publish</Button>}
                  <Button size="sm" variant="ghost"><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(post.id)} className="text-danger-600"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Post" size="lg"
        footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate} loading={uploading}>Publish</Button></>}
      >
        <div className="space-y-4">
          <Field label="Content">
            <Textarea value={formData.text} onChange={(e) => setFormData({ ...formData, text: e.target.value })} rows={4} placeholder="What's on your mind?" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Visibility">
              <Select value={formData.visibility} onChange={(e) => setFormData({ ...formData, visibility: e.target.value as Visibility })}>
                <option value="PUBLIC">Public</option>
                <option value="FOLLOWERS">Followers only</option>
                <option value="SUBSCRIBERS">Subscribers</option>
                <option value="VIP">VIP</option>
                <option value="PPV">PPV (Pay-per-view)</option>
              </Select>
            </Field>
            {formData.visibility === 'PPV' && (
              <Field label="Price ($)">
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
              </Field>
            )}
          </div>
          <Field label="Schedule (optional)">
            <Input type="datetime-local" value={formData.scheduledAt} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} />
          </Field>
          <label className="block border-2 border-dashed border-ink-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand-300 transition-colors">
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaSelect} />
            <p className="text-sm text-ink-500">Add photos and videos</p>
            <p className="text-xs text-ink-400 mt-1">Select several files at once</p>
          </label>
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {mediaFiles.map((item, index) => (
                <div key={`${item.file.name}-${index}`} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => moveMedia(Number(e.dataTransfer.getData('text/plain')), index)} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
                  {item.file.type.startsWith('video/') ? <video src={item.preview} controls preload="metadata" className="w-full h-full object-cover" /> : <img src={item.preview} alt={item.file.name} loading="lazy" className="w-full h-full object-cover" />}
                  <span className="absolute top-2 left-2 p-1 rounded bg-black/50 text-white"><GripVertical className="w-4 h-4" /></span>
                  <button type="button" onClick={() => removeMedia(index)} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-danger-600" title="Remove media" aria-label="Remove media"><X className="w-4 h-4" /></button>
                  <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 rounded px-1.5 py-0.5">{index + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Post" message="Are you sure you want to delete this post? This cannot be undone." confirmLabel="Delete" danger />
    </DashboardShell>
  );
}