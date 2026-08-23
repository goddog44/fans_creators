import { useState, useEffect } from 'react';
import { Home as HomeIcon, Compass, CreditCard, MessageSquare, Bell, Bookmark, User } from 'lucide-react';
import { UserShell } from '@/components/layout/UserShell';
import { PostCard } from '@/components/shared/PostCard';
import { ModelCard } from '@/components/shared/ModelCard';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { contentService, modelService, subscriptionService } from '@/services';
import type { Post, User as UserType } from '@/types';

export function UserHome() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [models, setModels] = useState<Record<string, UserType>>({});
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [suggested, setSuggested] = useState<UserType[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      contentService.getFeedPosts(user.id),
      subscriptionService.getByUser(user.id),
      modelService.getAll(),
    ]).then(([feed, subs, allModels]) => {
      setPosts(feed);
      const modelMap: Record<string, UserType> = {};
      allModels.forEach((m) => { modelMap[m.id] = m; });
      setModels(modelMap);
      setSubscriptions(new Set(subs.filter((s) => s.status === 'ACTIVE').map((s) => s.modelId)));
      setSuggested(allModels.filter((m) => !subs.some((s) => s.modelId === m.id)).slice(0, 3));
      setLoading(false);
    });
  }, [user]);

  if (loading) return <UserShell><LoadingState /></UserShell>;

  return (
    <UserShell>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h1 className="font-display font-bold text-2xl text-ink-900">Your Feed</h1>
          {posts.length === 0 ? (
            <EmptyState
              title="Your feed is empty"
              description="Subscribe to creators to see their posts here"
            />
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                model={models[post.modelId]}
                currentUser={user}
                isSubscribed={subscriptions.has(post.modelId)}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block space-y-6">
          <div>
            <h2 className="font-display font-bold text-lg text-ink-900 mb-3">Suggested for you</h2>
            <div className="space-y-3">
              {suggested.map((m) => (
                <ModelCard key={m.id} model={m} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </UserShell>
  );
}
