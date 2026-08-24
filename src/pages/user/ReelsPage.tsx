import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RoleShell } from '@/components/layout/RoleShell';
import { ReelCard } from '@/components/shared/ReelCard';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { reelService, userService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { Reel, User } from '@/types';

export function ReelsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [reels, setReels] = useState<Reel[]>([]);
  const [creators, setCreators] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void reelService.getAll().then(async (items) => {
      setReels(items);
      const profiles = await Promise.all([...new Set(items.map((item) => item.modelId))].map((id) => userService.getById(id)));
      const profileMap: Record<string, User> = {};
      profiles.forEach((profile) => { if (profile) profileMap[profile.id] = profile; });
      setCreators(profileMap);
    }).finally(() => setLoading(false));
  }, []);

  const visibleReels = id ? reels.filter((reel) => reel.id === id) : reels;
  return <RoleShell><h1 className="mb-5 font-display text-2xl font-bold text-ink-900">Reels</h1>{loading ? <LoadingState /> : visibleReels.length === 0 ? <EmptyState title="Reel not found" description="This Reel may have been removed or is no longer available." /> : <div className="flex snap-y snap-mandatory flex-col items-center gap-6">{visibleReels.map((reel) => <ReelCard key={reel.id} reel={reel} creator={creators[reel.modelId]} currentUser={user} />)}</div>}</RoleShell>;
}
