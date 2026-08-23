import { useState } from 'react';
import { UserShell } from '@/components/layout/UserShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfileMediaEditor } from '@/components/shared/ProfileMediaEditor';
import { Input, Field, Textarea } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { userService } from '@/services';
import { BadgeCheck, Mail, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/format';

export function UserProfile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
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

  if (!user) return null;

  return (
    <UserShell>
      <h1 className="font-display font-bold text-2xl text-ink-900 mb-6">My Profile</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile card */}
        <Card className="overflow-hidden">
          <CardBody>
            <ProfileMediaEditor user={user} onUpdated={updateUser} />
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-ink-900">{user.name}</h2>
              {user.verified && <BadgeCheck className="w-5 h-5 text-brand-500" />}
            </div>
            <p className="text-sm text-ink-500">@{user.username}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-ink-500">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {formatDate(user.createdAt)}</span>
            </div>
          </CardBody>
        </Card>

        {/* Edit form */}
        <Card className="p-6">
          <h3 className="font-display font-bold text-lg text-ink-900 mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Username">
              <Input value={user.username} disabled />
            </Field>
            <Field label="Email">
              <Input value={user.email} disabled />
            </Field>
            <Field label="Bio">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell others about yourself..." />
            </Field>
            <Button onClick={handleSave} loading={saving}>Save changes</Button>
          </div>
        </Card>

        {/* Account info */}
        <Card className="p-6">
          <h3 className="font-display font-bold text-lg text-ink-900 mb-4">Account</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-ink-500">Account type</span><span className="text-sm font-semibold text-ink-900">Member</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Status</span><span className="text-sm font-semibold text-success-600">Active</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Member since</span><span className="text-sm font-semibold text-ink-900">{formatDate(user.createdAt)}</span></div>
          </div>
        </Card>
      </div>
    </UserShell>
  );
}
