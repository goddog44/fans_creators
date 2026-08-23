import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center text-ink-400 mb-4">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="font-display font-bold text-ink-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-500 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-500">{label}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-danger-50 flex items-center justify-center text-danger-500 mb-4 text-2xl font-bold">!</div>
      <h3 className="font-display font-bold text-ink-900 mb-1">Something went wrong</h3>
      <p className="text-sm text-ink-500 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
          Try again
        </button>
      )}
    </div>
  );
}
