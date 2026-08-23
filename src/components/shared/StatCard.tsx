import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; up: boolean };
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'neutral';
}

const toneClasses = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  neutral: 'bg-ink-100 text-ink-600',
};

export function StatCard({ label, value, icon, trend, tone = 'neutral' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneClasses[tone]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend.up ? 'text-success-600' : 'text-danger-600'}`}>
            {trend.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500 mt-0.5">{label}</p>
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
