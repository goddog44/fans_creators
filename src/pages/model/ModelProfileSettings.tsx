import { useState } from 'react';
import { Camera, BadgeCheck, Link2, Plus, X } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input, Field, Textarea } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { userService } from '@/services';
import { modelNavItems } from '@/lib/nav';

export function ModelProfileSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [subPrice, setSubPrice] = useState(user?.subscriptionPrice || 0);
  const [links, setLinks] = useState(user?.socialLinks || []);
  const [newLink, setNewLink] = useState({ platform: '', url: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await userService.updateProfile(user!.id, { name, bio, subscriptionPrice: subPrice, socialLinks: links });
    updateUser({ name, bio, subscriptionPrice: subPrice, socialLinks: links });
    setSaving(false);
    toast('Profile updated successfully');
  };

  const addLink = () => {
    if (!newLink.platform || !newLink.url) return;
    setLinks([...links, newLink]);
    setNewLink({ platform: '', url: '' });
  };

  return (
    <DashboardShell navItems={modelNavItems}>
      <PageHeader title="Profile" subtitle="Customize your public profile" />

      <div className="max-w-2xl space-y-6">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-brand-400 to-brand-600 relative">
            <div className="absolute -bottom-12 left-6">
              <Avatar src={user?.avatar || ''} size="2xl" className="border-4 border-white rounded-full" />
            </div>
            <button className="absolute top-3 right-3 p-2 rounded-xl bg-white/20 backdrop-blur text-white hover:bg-white/30 transition-colors"><Camera className="w-4 h-4" /></button>
          </div>
          <CardBody className="pt-14">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-ink-900">{user?.name}</h2>
              {user?.verified && <BadgeCheck className="w-5 h-5 text-brand-500" />}
            </div>
            <p className="text-sm text-ink-500">@{user?.username}</p>
          </CardBody>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-bold text-lg text-ink-900 mb-4">Profile Information</h3>
          <div className="space-y-4">
            <Field label="Display Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Bio"><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell fans about yourself..." /></Field>
            <Field label="Subscription Price ($/month)"><Input type="number" value={subPrice} onChange={(e) => setSubPrice(Number(e.target.value))} /></Field>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-bold text-lg text-ink-900 mb-4">Social Links</h3>
          <div className="space-y-2 mb-4">
            {links.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 p-2.5 rounded-xl bg-ink-50">
                  <Link2 className="w-4 h-4 text-ink-400" />
                  <span className="text-sm font-semibold text-ink-700">{link.platform}</span>
                  <span className="text-sm text-ink-500 truncate">{link.url}</span>
                </div>
                <button onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="p-2 text-ink-400 hover:text-danger-600"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newLink.platform} onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })} placeholder="Platform" className="w-32" />
            <Input value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} placeholder="https://..." className="flex-1" />
            <Button variant="outline" onClick={addLink}><Plus className="w-4 h-4" /></Button>
          </div>
        </Card>

        <Button onClick={handleSave} loading={saving} size="lg">Save Changes</Button>
      </div>
    </DashboardShell>
  );
}
