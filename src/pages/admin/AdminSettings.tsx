import { useState } from 'react';
import { Key, Mail, Bell, Shield, Globe, Percent } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Field, Select } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { adminNavItems } from '@/lib/nav';

export function AdminSettings() {
  const { toast } = useToast();
  const [platformName, setPlatformName] = useState('CreatorHub');
  const [commission, setCommission] = useState(20);
  const [minPayout, setMinPayout] = useState(50);

  const handleSave = () => {
    toast('Platform settings saved');
  };

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Settings" subtitle="Platform configuration" />

      <div className="max-w-2xl space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Platform Settings</h3>
          </div>
          <div className="space-y-4">
            <Field label="Platform Name"><Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} /></Field>
            <Field label="Platform Commission (%)"><Input type="number" value={commission} onChange={(e) => setCommission(Number(e.target.value))} /></Field>
            <Field label="Minimum Payout ($)">
              <Input type="number" value={minPayout} onChange={(e) => setMinPayout(Number(e.target.value))} />
            </Field>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Security</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-ink-900">Two-factor authentication</p><p className="text-xs text-ink-500">Required for admin accounts</p></div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-ink-900">IP whitelist</p><p className="text-xs text-ink-500">Restrict admin access by IP</p></div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-ink-600" />
            <h3 className="font-display font-bold text-lg text-ink-900">Admin Notifications</h3>
          </div>
          <div className="space-y-3">
            {['New reports', 'Model verification requests', 'Payout approvals needed', 'Transaction anomalies', 'System alerts'].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">{item}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-5 bg-ink-200 rounded-full peer peer-checked:bg-ink-900 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
