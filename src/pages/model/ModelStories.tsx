import { useEffect, useState } from 'react';
import { CirclePlay, Plus, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StoryViewer } from '@/components/shared/StoryViewer';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea, Select, Field } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { storyService } from '@/services';
import type { Story } from '@/types';
import { modelNavItems } from '@/lib/nav';

export function ModelStories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [text, setText] = useState('');
  const [durationHours, setDurationHours] = useState(6);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaFile, setMediaFile] = useState<File>();
  const [background, setBackground] = useState('linear-gradient(135deg, #111827, #374151)');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const backgrounds = ['linear-gradient(135deg, #111827, #374151)', 'linear-gradient(135deg, #be123c, #f97316)', 'linear-gradient(135deg, #0f766e, #164e63)', 'linear-gradient(135deg, #312e81, #7c3aed)', 'linear-gradient(135deg, #f59e0b, #dc2626)', '#f8fafc'];

  useEffect(() => {
    if (!user) return;
    storyService.getByModel(user.id).then(setStories).finally(() => setLoading(false));
  }, [user]);

  const createStory = async () => {
    if (!user || (!text.trim() && !mediaFile)) return;
    setSaving(true);
    try {
      const story = await storyService.create(user.id, text.trim(), durationHours, mediaFile, visibility, background);
      setStories((current) => [story, ...current]);
      setText('');
      setMediaFile(undefined);
      toast('Story published successfully');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not publish story', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeStory = async (id: string) => {
    try {
      await storyService.remove(id);
      setStories((current) => current.filter((story) => story.id !== id));
      toast('Story deleted', 'info');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not delete story', 'error');
    }
  };

  return (
    <DashboardShell navItems={modelNavItems}>
      <PageHeader title="Stories" subtitle="Share a short update with your audience" />
      <Card className="mb-6">
        <CardBody>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Share an update..." maxLength={500} rows={4} />
          <input type="file" accept="image/*,video/*" onChange={(event) => setMediaFile(event.target.files?.[0])} className="mt-3 block w-full text-sm text-ink-500" />
          {!mediaFile && <div className="mt-3"><p className="mb-2 text-sm font-semibold text-ink-700">Text background</p><div className="flex flex-wrap gap-2">{backgrounds.map((style) => <button key={style} type="button" onClick={() => setBackground(style)} className={`h-9 w-9 rounded-full border-2 ${background === style ? 'border-ink-900' : 'border-white'}`} style={{ background: style }} aria-label="Choose story background" />)}</div></div>}
          <div className="flex items-end justify-between gap-3 mt-3">
            <Field label="Visible for">
              <Select value={durationHours} onChange={(event) => setDurationHours(Number(event.target.value))} className="w-auto">
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </Select>
            </Field>
            <Field label="Visibility">
              <Select value={visibility} onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'PRIVATE')} className="w-auto">
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </Select>
            </Field>
            <Button onClick={createStory} loading={saving} disabled={!text.trim() && !mediaFile}><Plus className="w-4 h-4" /> Publish story</Button>
          </div>
        </CardBody>
      </Card>
      {loading ? <LoadingState /> : stories.length === 0 ? (
        <EmptyState title="No active stories" description="Publish your first story to connect with your audience." icon={<CirclePlay className="w-8 h-8" />} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => (
            <Card key={story.id}>
              <CardBody>
                <button type="button" onClick={() => setSelectedStory(story)} className="w-full text-left"><p className="text-sm text-ink-800 whitespace-pre-wrap mb-4">{story.text}</p></button>
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>{new Date(story.createdAt).toLocaleString()}</span>
                  <Button size="sm" variant="ghost" onClick={() => removeStory(story.id)} className="text-danger-600" title="Delete story"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      <StoryViewer story={selectedStory} model={user || undefined} onClose={() => setSelectedStory(null)} />
    </DashboardShell>
  );
}
