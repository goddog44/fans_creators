import { useEffect, useState } from 'react';
import { DollarSign, Wallet, Clock, TrendingUp, Gift, Lock, CreditCard } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Field, Select } from '@/components/ui/Input';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { modelService, transactionService, payoutService } from '@/services';
import type { Transaction, Payout } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { modelNavItems as navItems } from '@/lib/nav';

export function ModelEarnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutMethod, setPayoutMethod] = useState('Bank Transfer');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      modelService.getStats(user.id),
      transactionService.getByModel(user.id),
      payoutService.getByUser(user.id),
    ]).then(([s, t, p]) => {
      setStats(s);
      setTxns(t);
      setPayouts(p);
      setPayoutAmount(s.availableBalance);
      setLoading(false);
    });
  }, [user]);

  const handlePayout = async () => {
    if (!user) return;
    await payoutService.requestPayout(user.id, payoutAmount, payoutMethod);
    setShowPayout(false);
    toast('Payout requested successfully');
    payoutService.getByUser(user.id).then(setPayouts);
  };

  if (loading) return <DashboardShell navItems={navItems}><LoadingState /></DashboardShell>;

  return (
    <DashboardShell navItems={navItems}>
      <PageHeader title="Earnings" subtitle="Track your revenue and request payouts" action={<Button onClick={() => setShowPayout(true)} disabled={stats.availableBalance <= 0}>Request Payout</Button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Earnings" value={formatCurrency(stats.totalEarnings)} icon={<DollarSign className="w-5 h-5" />} tone="success" />
        <StatCard label="Available" value={formatCurrency(stats.availableBalance)} icon={<Wallet className="w-5 h-5" />} tone="brand" />
        <StatCard label="Pending" value={formatCurrency(stats.pendingBalance)} icon={<Clock className="w-5 h-5" />} tone="warning" />
        <StatCard label="Subscriptions" value={formatCurrency(stats.subscriptionRevenue)} icon={<CreditCard className="w-5 h-5" />} tone="accent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="PPV Revenue" value={formatCurrency(stats.ppvRevenue)} icon={<Lock className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Tips" value={formatCurrency(stats.tipRevenue)} icon={<Gift className="w-5 h-5" />} tone="neutral" />
        <StatCard label="Engagement" value={`${stats.engagement}%`} icon={<TrendingUp className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardBody>
            {txns.length === 0 ? (
              <EmptyState title="No transactions yet" />
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {txns.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{t.description}</p>
                      <p className="text-xs text-ink-500">{formatDateTime(t.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink-900">{formatCurrency(t.amount)}</p>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payouts</CardTitle></CardHeader>
          <CardBody>
            {payouts.length === 0 ? (
              <EmptyState title="No payouts yet" description="Request a payout when you have available balance" />
            ) : (
              <div className="space-y-2">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink-900">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-ink-500">{p.method} · {formatDateTime(p.createdAt)}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Modal open={showPayout} onClose={() => setShowPayout(false)} title="Request Payout" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowPayout(false)}>Cancel</Button><Button onClick={handlePayout}>Request</Button></>}>
        <div className="space-y-4">
          <div className="p-3 bg-brand-50 rounded-xl text-sm text-brand-700">
            Available balance: <span className="font-bold">{formatCurrency(stats.availableBalance)}</span>
          </div>
          <Field label="Amount ($)">
            <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(Number(e.target.value))} max={stats.availableBalance} />
          </Field>
          <Field label="Method">
            <Select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
              <option>Bank Transfer</option>
              <option>PayPal</option>
              <option>Wire</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </DashboardShell>
  );
}
