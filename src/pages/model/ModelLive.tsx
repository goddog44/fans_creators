import { useEffect, useMemo, useState } from 'react';
import { Radio, Play, Square, Sparkles, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { LiveRoom } from '@/components/shared/LiveRoom';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Field, Select } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { liveService } from '@/services';
import { modelNavItems } from '@/lib/nav';
import type { Visibility, LiveStream } from '@/types';

export function ModelLive() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void liveService.getByModel(user.id)
      .then(setStreams)
      .catch((error) => toast(error instanceof Error ? error.message : 'Could not load live sessions', 'error'))
      .finally(() => setLoading(false));
  }, [toast, user]);

  const activeStream = useMemo(() => streams.find((stream) => stream.status === 'LIVE') ?? null, [streams]);

  const createLive = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const stream = await liveService.start(user.id, title.trim() || 'Live now', description.trim(), visibility);
      setStreams((current) => [stream, ...current.filter((item) => item.id !== stream.id)]);
      setTitle('');
      setDescription('');
      toast('Live room started');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not start live room', 'error');
    } finally {
      setSaving(false);
    }
  };

  const endLive = async (id: string) => {
    try {
      const stream = await liveService.end(id);
      setStreams((current) => current.map((item) => item.id === id ? stream : item));
      toast('Live room ended');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not end stream', 'error');
    }
  };

  const removeLive = async (id: string) => {
    try {
      await liveService.update(id, { status: 'ENDED' });
      setStreams((current) => current.filter((item) => item.id !== id));
      toast('Stream removed');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not remove stream', 'error');
    }
  };

  return (
    <DashboardShell navItems={modelNavItems}>
      <PageHeader title="Live" subtitle="Go live for free and keep the room open for your audience" />
      {activeStream && user && <div className="mb-6"><LiveRoom stream={activeStream} currentUser={user} host onEnded={() => setStreams((current) => current.map((item) => item.id === activeStream.id ? { ...item, status: 'ENDED', endedAt: new Date().toISOString() } : item))} /></div>}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>Start a free stream</CardTitle></CardHeader>
          <CardBody>
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-brand-50 p-3 text-brand-700">
              <Radio className="h-5 w-5" />
              <span className="text-sm font-semibold">No payment flow, no tokens, no monetization.</span>
            </div>
            <Field label="Title">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Live with me today" maxLength={80} />
            </Field>
            <Field label="Description" className="mt-4">
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Tell viewers what they can expect in the session" maxLength={500} />
            </Field>
            <Field label="Visibility" className="mt-4">
              <Select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}>
                <option value="PUBLIC">Public</option>
                <option value="FOLLOWERS">Followers</option>
                <option value="SUBSCRIBERS">Subscribers</option>
              </Select>
            </Field>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTitle('')}>
                Clear
              </Button>
              <Button onClick={createLive} loading={saving} disabled={!user || (!title.trim() && !description.trim())}>
                <Play className="h-4 w-4" /> {activeStream ? 'Restart live room' : 'Go live'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Current room</CardTitle></CardHeader>
          <CardBody>
            {activeStream ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-ink-900 p-4 text-white">
                  <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink-300">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-danger-500 animate-pulse" /> Live</span>
                    <span>{activeStream.viewerCount} watching</span>
                  </div>
                  <h3 className="text-xl font-bold">{activeStream.title}</h3>
                  <p className="mt-2 text-sm text-ink-200">{activeStream.description || 'No description provided.'}</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-ink-600">
                  <Users className="h-4 w-4" />
                  <span>{activeStream.visibility} audience</span>
                </div>
                <Button variant="danger" onClick={() => endLive(activeStream.id)} className="w-full">
                  <Square className="h-4 w-4" /> End stream
                </Button>
              </div>
            ) : (
              <EmptyState title="No live room active" description="Start one to connect with your audience in real time." icon={<Sparkles className="h-8 w-8" />} />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 font-display text-xl font-bold text-ink-900">Recent streams</h2>
        {loading ? <LoadingState /> : streams.length === 0 ? (
          <EmptyState title="No streams yet" description="Your recent free livestreams will appear here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {streams.map((stream) => (
              <Card key={stream.id}>
                <CardBody>
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${stream.status === 'LIVE' ? 'bg-danger-100 text-danger-700' : 'bg-ink-100 text-ink-600'}`}>
                      {stream.status}
                    </span>
                    <button type="button" onClick={() => removeLive(stream.id)} className="text-xs font-semibold text-danger-600 hover:text-danger-700">Remove</button>
                  </div>
                  <p className="text-lg font-bold text-ink-900">{stream.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-600">{stream.description || 'No description'}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
                    <span>{stream.visibility}</span>
                    <span>{new Date(stream.createdAt).toLocaleDateString()}</span>
                  </div>
                  {stream.status === 'LIVE' && (
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => endLive(stream.id)} className="w-full">
                        End stream
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
