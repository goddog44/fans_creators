import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';
import { roleHomeRoute } from '@/lib/rbac';

interface ProtectedRouteProps {
  roles: Role[];
  children: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={roleHomeRoute[user.role]} replace />;
  }

  return <>{children}</>;
}
