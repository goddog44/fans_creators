import type { Role } from '@/types';

export const roleHomeRoute: Record<Role, string> = {
  ADMIN: '/admin',
  MANAGER: '/manager',
  MODEL: '/model',
  USER: '/home',
};

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  MODEL: 'Creator',
  USER: 'Member',
};

export function canAccess(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole);
}

// Manager scope check — can only see models assigned to them
export function isModelManagedBy(modelManagerId: string | undefined, managerId: string): boolean {
  return modelManagerId === managerId;
}
