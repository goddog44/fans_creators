import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { UserShell } from '@/components/layout/UserShell';
import { adminNavItems, managerNavItems, modelNavItems } from '@/lib/nav';

export function RoleShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user?.role === 'MODEL') {
    return <DashboardShell navItems={modelNavItems}>{children}</DashboardShell>;
  }

  if (user?.role === 'MANAGER') {
    return <DashboardShell navItems={managerNavItems} brandColor="accent">{children}</DashboardShell>;
  }

  if (user?.role === 'ADMIN') {
    return <DashboardShell navItems={adminNavItems} brandColor="ink">{children}</DashboardShell>;
  }

  return <UserShell>{children}</UserShell>;
}
