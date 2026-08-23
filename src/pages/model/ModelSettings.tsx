import { useState } from 'react';
import { Key, Mail, Bell, Shield, Lock } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { modelNavItems } from '@/lib/nav';

export function ModelSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast('Password updated successfully');
  };

  return (
    <DashboardShell navItems={modelNavItems}>
      <PageHeader title="Settings" subtitle="Manage your account settings" />

      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Change Password</h3>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Field label="Current Password"><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" /></Field>
            <Field label="New Password"><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" /></Field>
            <Field label="Confirm Password"><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" /></Field>
            <Button type="submit">Update Password</Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Email</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">{user?.email}</p>
              <p className="text-xs text-success-600">Verified</p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'New subscribers', desc: 'Get notified when someone subscribes' },
              { label: 'New messages', desc: 'Get notified of new messages' },
              { label: 'Tips received', desc: 'Get notified when you receive a tip' },
              { label: 'PPV purchases', desc: 'Get notified when PPV content is purchased' },
              { label: 'Payout updates', desc: 'Get notified about payout status changes' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                  <p className="text-xs text-ink-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-ink-200 rounded-full peer peer-checked:bg-brand-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Security</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">Two-factor authentication</p>
                <p className="text-xs text-ink-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">Active sessions</p>
                <p className="text-xs text-ink-500">Manage your logged-in devices</p>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
