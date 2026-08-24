import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RoleShell } from '@/components/layout/RoleShell';
import { StoryViewer } from '@/components/shared/StoryViewer';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { storyService, userService } from '@/services';
import type { Story, User } from '@/types';
import { profilePath } from '@/lib/contentRoutes';

export function StoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [model, setModel] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    void storyService.getById(id).then(async (result) => {
      setStory(result || null);
      if (result) setModel((await userService.getById(result.modelId)) || null);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <RoleShell><LoadingState /></RoleShell>;
  if (!story || !model) return <RoleShell><EmptyState title="Story not found" description="This Story may have expired or is no longer available." /></RoleShell>;

  return (
    <RoleShell>
      <StoryViewer story={story} model={model} onClose={() => navigate(profilePath(model.id))} />
    </RoleShell>
  );
}
