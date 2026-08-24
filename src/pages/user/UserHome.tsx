import { useState, useEffect, useRef, useCallback } from 'react';
import { RoleShell } from '@/components/layout/RoleShell';
import { PostCard } from '@/components/shared/PostCard';
import { ModelCard } from '@/components/shared/ModelCard';
import { StoryViewer } from '@/components/shared/StoryViewer';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { contentService, messageService, modelService, storyService, subscriptionService } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Post, Story, User as UserType } from '@/types';

export function UserHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [models, setModels] = useState<Record<string, UserType>>({});
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [suggested, setSuggested] = useState<UserType[]>([]);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [feedPage, setFeedPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = feedPage + 1;
      const nextPosts = await contentService.getFeedPosts(user.id, nextPage);
      setPosts((current) => [...current, ...nextPosts]);
      setFeedPage(nextPage);
      setHasMore(nextPosts.length === 8);
    } finally {
      setLoadingMore(false);
    }
  }, [feedPage, hasMore, loadingMore, user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      contentService.getFeedPosts(user.id, 0),
      subscriptionService.getByUser(user.id),
      modelService.getAll(),
      storyService.getActive(),
    ]).then(([feed, subs, allModels, stories]) => {
      setPosts(feed);
      const modelMap: Record<string, UserType> = {};
      allModels.forEach((m) => { modelMap[m.id] = m; });
      setModels(modelMap);
      setSubscriptions(new Set(subs.filter((s) => s.status === 'ACTIVE').map((s) => s.modelId)));
      setSuggested(allModels.filter((m) => !subs.some((s) => s.modelId === m.id)).slice(0, 3));
      setActiveStories(stories);
      setFeedPage(0);
      setHasMore(feed.length === 8);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const target = feedEndRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMorePosts();
    }, { rootMargin: '480px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMorePosts]);

  if (loading) return <RoleShell><LoadingState /></RoleShell>;

  const storyByModel = new Map<string, Story>();
  activeStories.forEach((story) => {
    if (!storyByModel.has(story.modelId)) storyByModel.set(story.modelId, story);
  });
  const storyModels = Array.from(storyByModel.values()).map((story) => ({
    story,
    model: models[story.modelId],
  })).filter((item): item is { story: Story; model: UserType } => Boolean(item.model));
  const selectedModel = selectedStory ? models[selectedStory.modelId] : undefined;
  const replyToStory = async (text: string) => {
    if (!user || !selectedStory || !selectedModel) return;
    const conversation = await messageService.getOrCreateConversation(user.id, selectedModel.id);
    await messageService.sendMessage(conversation.id, user.id, { type: 'TEXT', text: `[Story ${selectedStory.id}] ${text}`, storyId: selectedStory.id });
    toast('Story reply sent', 'success');
  };

  return (
    <RoleShell>
      {storyModels.length > 0 && (
        <section className="mb-6" aria-label="Active stories">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {storyModels.map(({ story, model }) => (
              <button key={story.id} type="button" onClick={() => setSelectedStory(story)} className="flex w-20 shrink-0 flex-col items-center gap-2" aria-label={`View ${model.name}'s story`}>
                <span className="rounded-full bg-gradient-to-tr from-brand-500 via-danger-500 to-accent-500 p-1">
                  <img src={model.avatar || '/image-removebg-preview.png'} alt="" className="h-16 w-16 rounded-full border-4 border-white bg-ink-100 object-cover" />
                </span>
                <span className="w-full truncate text-center text-xs font-semibold text-ink-700">{model.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}
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
          <div ref={feedEndRef} className="h-8" aria-hidden="true" />
          {loadingMore && <p className="py-4 text-center text-sm text-ink-500">Loading more posts...</p>}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block space-y-6">
          <div>
            <h2 className="font-display font-bold text-lg text-ink-900 mb-3">Suggested for you</h2>
            <div className="space-y-3">
              {suggested.map((m) => (
                <ModelCard key={m.id} model={m} hasActiveStory={storyByModel.has(m.id)} onStoryClick={() => setSelectedStory(storyByModel.get(m.id) || null)} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <StoryViewer story={selectedStory} model={selectedModel} onClose={() => setSelectedStory(null)} onReply={replyToStory} />
    </RoleShell>
  );
}
