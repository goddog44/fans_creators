import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Radio, ArrowLeft } from 'lucide-react';
import { RoleShell } from '@/components/layout/RoleShell';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { LiveRoom } from '@/components/shared/LiveRoom';
import { useAuth } from '@/context/AuthContext';
import { liveService, modelService } from '@/services';
import type { LiveStream, User } from '@/types';

export function UserLivePage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [creators, setCreators] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void liveService.getActive().then(async (items) => {
      setStreams(items);
      const ids = [...new Set(items.map((item) => item.modelId))];
      if (ids.length === 0) {
        setCreators({});
        return;
      }
      const profiles = await Promise.all(ids.map((modelId) => modelService.getById(modelId)));
      const map: Record<string, User> = {};
      profiles.forEach((profile) => {
        if (profile) map[profile.id] = profile;
      });
      setCreators(map);
    }).finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() => {
    if (!id) return streams[0] ?? null;
    return streams.find((stream) => stream.id === id) ?? null;
  }, [id, streams]);

  return (
    <RoleShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">CreatorHub Live</p>
          <h1 className="font-display text-3xl font-bold text-ink-900">Free live streams</h1>
        </div>
        {selected && (
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
      </div>

      {loading ? <LoadingState /> : streams.length === 0 ? (
        <EmptyState title="No live streams right now" description="Check back soon for creators going live for free." icon={<Radio className="h-8 w-8" />} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardBody>
              {selected && user && <LiveRoom stream={selected} currentUser={user} host={selected.modelId === user.id} onEnded={() => navigate('/live')} />}
            </CardBody>
          </Card>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-ink-900">Current rooms</h2>
            {streams.map((stream) => {
              const creator = creators[stream.modelId];
              const isSelected = selected?.id === stream.id;
              return (
                <button key={stream.id} type="button" onClick={() => navigate(`/live/${stream.id}`)} className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300'}`}>
                  <div className="flex items-center gap-3">
                    <img src={creator?.avatar || '/image-removebg-preview.png'} alt="" className="h-12 w-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-ink-900">{stream.title}</p>
                      <p className="text-xs text-ink-500">{creator?.name || 'Creator'} · {stream.viewerCount} watching</p>
                    </div>
                    <span className="rounded-full bg-danger-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-danger-700">Live</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </RoleShell>
  );
}
