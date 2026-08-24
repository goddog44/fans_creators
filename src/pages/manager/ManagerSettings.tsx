import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Key, Mail, Bell, Shield } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfileMediaEditor } from '@/components/shared/ProfileMediaEditor';
import { Input, Field } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { userService } from '@/services';
import { managerNavItems } from '@/lib/nav';

export function ManagerSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await userService.updateProfile(user!.id, { name, bio });
    updateUser({ name, bio });
    setSaving(false);
    toast('Profile updated successfully');
  };

  return (
    <DashboardShell navItems={managerNavItems} brandColor="accent">
      <PageHeader title={location.pathname.endsWith('/profile') ? 'Profile' : 'Settings'} subtitle={location.pathname.endsWith('/profile') ? 'Manage your public profile' : 'Manage your account'} />

      <div className="max-w-2xl space-y-6">
        {user && <Card className="p-6"><h3 className="font-display font-bold text-lg text-ink-900 mb-4">Profile media</h3><ProfileMediaEditor user={user} onUpdated={updateUser} /></Card>}
        <Card className="p-6">
          <h3 className="font-display font-bold text-lg text-ink-900 mb-4">Profile</h3>
          <div className="space-y-4">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Bio"><Input value={bio} onChange={(e) => setBio(e.target.value)} /></Field>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Change Password</h3>
          </div>
          <div className="space-y-4">
            <Field label="New Password"><Input type="password" placeholder="••••••••" /></Field>
            <Field label="Confirm Password"><Input type="password" placeholder="••••••••" /></Field>
            <Button variant="outline">Update Password</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Notifications</h3>
          </div>
          <div className="space-y-3">
            {['Content awaiting review', 'New model assigned', 'Performance alerts', 'Revenue milestones'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{item}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-ink-200 rounded-full peer peer-checked:bg-accent-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
