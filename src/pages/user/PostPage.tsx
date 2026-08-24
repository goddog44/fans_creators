import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RoleShell } from '@/components/layout/RoleShell';
import { PostCard } from '@/components/shared/PostCard';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { contentService, userService, subscriptionService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { Post, User } from '@/types';

export function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post>();
  const [model, setModel] = useState<User>();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void Promise.resolve(contentService.getById(id)).then(async (result) => {
      setPost(result);
      if (result) {
        const [owner, isSubscribed] = await Promise.all([
          userService.getById(result.modelId),
          user ? subscriptionService.isSubscribed(user.id, result.modelId) : Promise.resolve(false),
        ]);
        setModel(owner);
        setSubscribed(isSubscribed);
      }
    }).finally(() => setLoading(false));
  }, [id, user]);

  return <RoleShell>{loading ? <LoadingState /> : post && model ? <PostCard post={post} model={model} currentUser={user} isSubscribed={subscribed} /> : <EmptyState title="Post not found" description="This post may have been removed or is no longer available." />}</RoleShell>;
}