import { useEffect, useState } from 'react';
import { Users, UserCircle, User as UserIcon, CreditCard, DollarSign, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/States';
import { userService, subscriptionService, transactionService, payoutService, reportService } from '@/services';
import type { User, Transaction, Report } from '@/types';
import { formatCurrency, formatTimeAgo } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminDashboard() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userService.getAll(),
      subscriptionService.getAll(),
      transactionService.getAll(),
      payoutService.getAll(),
      reportService.getAll(),
    ]).then(([u, s, t, p, r]) => {
      setAllUsers(u);
      setSubs(s);
      setTxns(t);
      setPayouts(p);
      setReports(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardShell navItems={adminNavItems} brandColor="ink"><LoadingState /></DashboardShell>;

  const managers = allUsers.filter((u) => u.role === 'MANAGER');
  const models = allUsers.filter((u) => u.role === 'MODEL');
  const regularUsers = allUsers.filter((u) => u.role === 'USER');
  const activeModels = models.filter((m) => m.status === 'ACTIVE');
  const activeUsers = regularUsers.filter((u) => u.status === 'ACTIVE');
  const revenue = txns.filter((t) => t.status === 'COMPLETED' && t.type !== 'PAYOUT').reduce((s, t) => s + t.amount, 0);
  const pendingPayouts = payouts.filter((p) => p.status === 'PENDING');
  const openReports = reports.filter((r) => r.status === 'OPEN' || r.status === 'UNDER_REVIEW');

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={regularUsers.length} icon={<Users className="w-5 h-5" />} tone="accent" />
        <StatCard label="Managers" value={managers.length} icon={<UserCircle className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Models" value={models.length} icon={<UserIcon className="w-5 h-5" />} tone="brand" />
        <StatCard label="Active Models" value={activeModels.length} icon={<UserIcon className="w-5 h-5" />} tone="success" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Users" value={activeUsers.length} icon={<Users className="w-5 h-5" />} tone="accent" />
        <StatCard label="Subscriptions" value={subs.length} icon={<CreditCard className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Total Revenue" value={formatCurrency(revenue)} icon={<DollarSign className="w-5 h-5" />} tone="success" trend={{ value: '+18%', up: true }} />
        <StatCard label="Pending Payouts" value={pendingPayouts.length} icon={<Wallet className="w-5 h-5" />} tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-end justify-between gap-2 h-40">
              {[30, 40, 35, 55, 45, 65, 60, 75, 70, 85, 80, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-ink-700 to-ink-900 rounded-t-lg" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-ink-400">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => <span key={m}>{m}</span>)}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Alerts</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-warning-50">
                <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0" />
                <div><p className="text-sm font-semibold text-ink-900">{openReports.length} open reports</p><p className="text-xs text-ink-500">Requires attention</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-warning-50">
                <Wallet className="w-5 h-5 text-warning-600 flex-shrink-0" />
                <div><p className="text-sm font-semibold text-ink-900">{pendingPayouts.length} pending payouts</p><p className="text-xs text-ink-500">Awaiting approval</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-50">
                <TrendingUp className="w-5 h-5 text-accent-600 flex-shrink-0" />
                <div><p className="text-sm font-semibold text-ink-900">Revenue up 18%</p><p className="text-xs text-ink-500">vs last month</p></div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {allUsers.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                  <Avatar src={u.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{u.name}</p>
                    <p className="text-xs text-ink-500">{u.role} · {formatTimeAgo(u.lastActive)}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {txns.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{t.description}</p>
                    <p className="text-xs text-ink-500">{formatTimeAgo(t.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-ink-900">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
