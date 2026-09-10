import { useEffect, useMemo, useRef, useState } from 'react';
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
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void liveService.getActive().then(async (items) => {
      if (!active) return;
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
    const unsubscribe = liveService.subscribeToLiveStreams((updated) => {
      setStreams((current) => {
        if (updated.status !== 'LIVE') return current.filter((item) => item.id !== updated.id);
        const exists = current.some((item) => item.id === updated.id);
        return exists ? current.map((item) => item.id === updated.id ? updated : item) : [updated, ...current];
      });
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const selected = useMemo(() => {
    if (!id) return streams[0] ?? null;
    return streams.find((stream) => stream.id === id) ?? null;
  }, [id, streams]);
  const selectedIndex = selected ? streams.findIndex((stream) => stream.id === selected.id) : -1;
  const moveToLive = (direction: 1 | -1) => {
    if (selectedIndex < 0) return;
    const next = streams[selectedIndex + direction];
    if (next) navigate(`/live/${next.id}`);
  };

  return (
    <RoleShell>
      <div className="mb-6 hidden items-center justify-between lg:flex">
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
        <div
          className="-mx-4 -my-6 grid min-h-[calc(100dvh-4rem)] gap-6 bg-ink-950 p-0 lg:mx-0 lg:my-0 lg:min-h-0 lg:grid-cols-[1.2fr_0.8fr] lg:bg-transparent lg:p-0"
          onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
          onTouchEnd={(event) => {
            if (touchStartY.current === null) return;
            const delta = event.changedTouches[0]?.clientY - touchStartY.current;
            touchStartY.current = null;
            if (Math.abs(delta) > 60) moveToLive(delta < 0 ? 1 : -1);
          }}
        >
          <Card>
            <CardBody className="p-0 lg:p-5">
              {selected && user && <LiveRoom stream={selected} currentUser={user} creator={creators[selected.modelId]} host={selected.modelId === user.id} onEnded={() => navigate('/live')} onLeave={() => navigate('/live')} />}
            </CardBody>
          </Card>

          <div className="hidden space-y-4 lg:block">
            <h2 className="font-display text-xl font-bold text-ink-900">Current rooms</h2>
            {streams.map((stream) => {
              const creator = creators[stream.modelId];
              const isSelected = selected?.id === stream.id;
              return (
                <button key={stream.id} type="button" onClick={() => navigate(`/live/${stream.id}`)} className={`w-full overflow-hidden rounded-2xl border text-left transition ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300'}`}>
                  <div className="relative aspect-video bg-gradient-to-br from-ink-900 via-brand-900 to-ink-800">
                    {stream.thumbnailUrl && <img src={stream.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                    <span className="absolute left-3 top-3 rounded-full bg-danger-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Live</span>
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <img src={creator?.avatar || '/image-removebg-preview.png'} alt="" className="h-12 w-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-ink-900">{stream.title}</p>
                      <p className="text-xs text-ink-500">{creator?.name || 'Creator'} · {stream.viewerCount} watching</p>
                    </div>
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
