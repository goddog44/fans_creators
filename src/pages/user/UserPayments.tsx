import { useState, useEffect } from 'react';
import { UserShell } from '@/components/layout/UserShell';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { transactionService, userService } from '@/services';
import type { Transaction, User } from '@/types';
import { formatDateTime, formatCurrency } from '@/lib/format';
import { DollarSign, CreditCard, Gift, Lock, RefreshCw } from 'lucide-react';

const typeIcons: Record<string, any> = {
  SUBSCRIPTION: CreditCard,
  PPV: Lock,
  TIP: Gift,
  PAYOUT: DollarSign,
  REFUND: RefreshCw,
};

export function UserPayments() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [models, setModels] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    transactionService.getByUser(user.id).then(async (t) => {
      setTxns(t);
      const ids = [...new Set(t.map((tr) => tr.modelId).filter(Boolean) as string[])];
      const modelData = await Promise.all(ids.map((id) => userService.getById(id)));
      const map: Record<string, User> = {};
      modelData.forEach((m) => { if (m) map[m.id] = m; });
      setModels(map);
      setLoading(false);
    });
  }, [user]);

  const total = txns.filter((t) => t.type !== 'PAYOUT' && t.status === 'COMPLETED').reduce((s, t) => s + t.amount, 0);

  return (
    <UserShell>
      <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Payments</h1>
      <p className="text-ink-500 mb-6">Your transaction history and payment methods</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <p className="text-sm text-ink-500">Total spent</p>
          <p className="text-2xl font-display font-bold text-ink-900 mt-1">{formatCurrency(total)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-500">Active subscriptions</p>
          <p className="text-2xl font-display font-bold text-ink-900 mt-1">{txns.filter((t) => t.type === 'SUBSCRIPTION').length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-500">PPV purchases</p>
          <p className="text-2xl font-display font-bold text-ink-900 mt-1">{txns.filter((t) => t.type === 'PPV').length}</p>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-display font-bold text-ink-900 mb-3">Payment method</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-brand-500 to-brand-700" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-ink-900">•••• 4242</p>
            <p className="text-xs text-ink-500">Expires 12/27</p>
          </div>
          <span className="text-xs font-semibold text-success-600">Active</span>
        </div>
      </Card>

      <h3 className="font-display font-bold text-lg text-ink-900 mb-3">Transaction History</h3>
      {loading ? (
        <LoadingState />
      ) : txns.length === 0 ? (
        <EmptyState title="No transactions yet" description="Your payment history will appear here" />
      ) : (
        <div className="space-y-2">
          {txns.map((t) => {
            const Icon = typeIcons[t.type] || DollarSign;
            const model = t.modelId ? models[t.modelId] : null;
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink-100 text-ink-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-900">{t.description}</p>
                    <p className="text-xs text-ink-500">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-ink-900">{formatCurrency(t.amount)}</p>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </UserShell>
  );
}
