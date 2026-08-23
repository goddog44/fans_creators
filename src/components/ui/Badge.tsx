import type { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-accent-100 text-accent-700',
  accent: 'bg-accent-100 text-accent-700',
};

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

const statusTones: Record<string, Tone> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  BLOCKED: 'danger',
  PENDING: 'warning',
  DRAFT: 'neutral',
  REVIEW: 'warning',
  APPROVED: 'info',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  REMOVED: 'danger',
  EXPIRED: 'neutral',
  CANCELLED: 'danger',
  COMPLETED: 'success',
  FAILED: 'danger',
  REFUNDED: 'warning',
  OPEN: 'warning',
  UNDER_REVIEW: 'info',
  RESOLVED: 'success',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTones[status] || 'neutral';
  return <Badge tone={tone}>{status.replace(/_/g, ' ')}</Badge>;
}
