import { useEffect, useState } from 'react';
import { RoleShell } from '@/components/layout/RoleShell';
import { StoryViewer } from '@/components/shared/StoryViewer';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { messageService, modelService, storyService } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Story, User } from '@/types';

export function UserStories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [models, setModels] = useState<Record<string, User>>({});
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void Promise.all([storyService.getActive(), modelService.getAll(), storyService.getViewedIds(user.id)])
      .then(([active, profiles, seen]) => {
        setStories(active);
        setModels(Object.fromEntries(profiles.map((profile) => [profile.id, profile])));
        setViewed(seen);
      })
      .catch((error) => toast(error instanceof Error ? error.message : 'Could not load Stories', 'error'))
      .finally(() => setLoading(false));
  }, [toast, user]);

  const grouped = new Map<string, Story[]>();
  stories.forEach((story) => grouped.set(story.modelId, [...(grouped.get(story.modelId) || []), story]));
  const storyGroups = [...grouped.entries()].map(([modelId, items]) => ({ model: models[modelId], items })).filter((group): group is { model: User; items: Story[] } => Boolean(group.model));
  const selectedStories = selected ? grouped.get(selected.modelId) || [selected] : [];
  const selectedModel = selected ? models[selected.modelId] : undefined;
  const reply = async (text: string, story: Story) => {
    if (!user || !selectedModel || selectedModel.id === user.id) return;
    const conversation = await messageService.getOrCreateConversation(user.id, selectedModel.id);
    await messageService.sendMessage(conversation.id, user.id, { type: 'TEXT', text: `[Story ${story.id}] ${text}`, storyId: story.id });
  };
  const markViewed = (story: Story) => {
    setViewed((current) => new Set(current).add(story.id));
    if (user) void storyService.markViewed(story.id, user.id);
  };

  return <RoleShell><h1 className="mb-5 font-display text-2xl font-bold text-ink-900">Stories</h1>{loading ? <LoadingState /> : storyGroups.length === 0 ? <EmptyState title="No active Stories" description="Active Stories from creators you can view will appear here." /> : <div className="flex flex-wrap gap-5">{storyGroups.map(({ model, items }) => <button key={model.id} type="button" onClick={() => setSelected(items[0])} className="flex w-20 flex-col items-center gap-2" aria-label={`View ${model.name}'s Stories`}><span className={`rounded-full p-1 ${items.some((story) => !viewed.has(story.id)) ? 'bg-gradient-to-tr from-brand-500 via-danger-500 to-accent-500' : 'bg-ink-300'}`}><img src={model.avatar || '/image-removebg-preview.png'} alt="" className="h-16 w-16 rounded-full border-4 border-white object-cover" /></span><span className="w-full truncate text-center text-xs font-semibold text-ink-700">{model.name}</span></button>)}</div>}<StoryViewer story={selected} model={selectedModel} stories={selectedStories} models={models} onSeen={markViewed} onReply={selectedModel?.id === user?.id ? undefined : reply} onClose={() => setSelected(null)} /></RoleShell>;
}