import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reelService } from '@/services';
import { modelNavItems } from '@/lib/nav';
import type { Visibility } from '@/types';

export function ModelReels() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<File>();
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [saving, setSaving] = useState(false);

  const publish = async () => {
    if (!user || !file) return;
    setSaving(true);
    try {
      await reelService.create(user.id, file, caption, hashtags.split(/\s+/).filter((tag) => tag.startsWith('#')), visibility);
      toast('Reel published successfully');
      navigate('/reels');
    } catch (error) { toast(error instanceof Error ? error.message : 'Could not publish Reel', 'error'); } finally { setSaving(false); }
  };

  return <DashboardShell navItems={modelNavItems}><PageHeader title="Create Reel" subtitle="Publish a short video for your audience" /><Card><CardBody><Field label="Video"><Input type="file" accept="video/*" onChange={(event) => setFile(event.target.files?.[0])} /></Field>{file && <video src={URL.createObjectURL(file)} controls muted className="mt-4 aspect-[9/16] max-h-80 w-full rounded-xl bg-black object-contain" />}<Field label="Description" className="mt-4"><Textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={2200} rows={3} placeholder="Add a caption..." /></Field><Field label="Hashtags" className="mt-4"><Input value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#creator #daily" /></Field><Field label="Visibility" className="mt-4"><Select value={visibility} onChange={(event) => setVisibility(event.target.value as Visibility)}><option value="PUBLIC">Public</option><option value="FOLLOWERS">Followers</option><option value="SUBSCRIBERS">Subscribers</option></Select></Field><div className="mt-5 flex justify-end"><Button onClick={publish} loading={saving} disabled={!file}>Publish Reel</Button></div></CardBody></Card></DashboardShell>;
}
