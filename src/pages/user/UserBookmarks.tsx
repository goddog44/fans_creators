import { useState, useEffect } from 'react';
import { RoleShell } from '@/components/layout/RoleShell';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { contentService, userService } from '@/services';
import type { Post, User } from '@/types';
import { PostCard } from '@/components/shared/PostCard';
import { Bookmark } from 'lucide-react';

export function UserBookmarks() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [models, setModels] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    contentService.getPosts().then(async (all) => {
      const bookmarked = all.slice(0, 4);
      setPosts(bookmarked);
      const ids = [...new Set(bookmarked.map((p) => p.modelId))];
      const modelData = await Promise.all(ids.map((id) => userService.getById(id)));
      const map: Record<string, User> = {};
      modelData.forEach((m) => { if (m) map[m.id] = m; });
      setModels(map);
      setLoading(false);
    });
  }, [user]);

  return (
    <RoleShell>
      <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Bookmarks</h1>
      <p className="text-ink-500 mb-6">Posts you've saved for later</p>

      {loading ? (
        <LoadingState />
      ) : posts.length === 0 ? (
        <EmptyState icon={<Bookmark className="w-8 h-8" />} title="No bookmarks yet" description="Tap the bookmark icon on any post to save it here" />
      ) : (
        <div className="space-y-4 max-w-2xl">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} model={models[post.modelId]} currentUser={user} />
          ))}
        </div>
      )}
    </RoleShell>
  );
}
