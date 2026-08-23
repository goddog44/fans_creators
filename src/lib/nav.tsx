import { LayoutDashboard, FileText, Users, MessageSquare, DollarSign, BarChart3, Bell, User, Settings, UserCircle, FolderOpen, Receipt, ShieldCheck, Wallet } from 'lucide-react';
import type { NavItem } from '@/components/layout/DashboardShell';

export const modelNavItems: NavItem[] = [
  { to: '/model', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/model/content', label: 'Content', icon: <FileText className="w-5 h-5" /> },
  { to: '/model/subscribers', label: 'Subscribers', icon: <Users className="w-5 h-5" /> },
  { to: '/model/messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
  { to: '/model/earnings', label: 'Earnings', icon: <DollarSign className="w-5 h-5" /> },
  { to: '/model/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { to: '/model/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { to: '/model/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  { to: '/model/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export const managerNavItems: NavItem[] = [
  { to: '/manager', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/manager/models', label: 'My Models', icon: <UserCircle className="w-5 h-5" /> },
  { to: '/manager/content', label: 'Content', icon: <FolderOpen className="w-5 h-5" /> },
  { to: '/manager/subscribers', label: 'Subscribers', icon: <Users className="w-5 h-5" /> },
  { to: '/manager/messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
  { to: '/manager/revenue', label: 'Revenue', icon: <DollarSign className="w-5 h-5" /> },
  { to: '/manager/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { to: '/manager/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { to: '/manager/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export const adminNavItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/admin/users', label: 'Users', icon: <Users className="w-5 h-5" /> },
  { to: '/admin/managers', label: 'Managers', icon: <UserCircle className="w-5 h-5" /> },
  { to: '/admin/models', label: 'Models', icon: <User className="w-5 h-5" /> },
  { to: '/admin/content', label: 'Content', icon: <FileText className="w-5 h-5" /> },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: <Receipt className="w-5 h-5" /> },
  { to: '/admin/transactions', label: 'Transactions', icon: <DollarSign className="w-5 h-5" /> },
  { to: '/admin/payouts', label: 'Payouts', icon: <Wallet className="w-5 h-5" /> },
  { to: '/admin/reports', label: 'Reports', icon: <ShieldCheck className="w-5 h-5" /> },
  { to: '/admin/moderation', label: 'Moderation', icon: <ShieldCheck className="w-5 h-5" /> },
  { to: '/admin/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { to: '/admin/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: <FileText className="w-5 h-5" /> },
];
