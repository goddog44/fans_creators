import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Search, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { roleLabel } from '@/lib/rbac';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/context/ToastContext';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface DashboardShellProps {
  navItems: NavItem[];
  children: ReactNode;
  brandColor?: string;
}

export function DashboardShell({ navItems, children, brandColor = 'brand' }: DashboardShellProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast('Signed out successfully', 'info');
    navigate('/login');
  };

  const colorClasses: Record<string, { bg: string; text: string; active: string; hover: string }> = {
    brand: { bg: 'bg-brand-600', text: 'text-brand-600', active: 'bg-brand-50 text-brand-700', hover: 'hover:bg-ink-100' },
    accent: { bg: 'bg-accent-600', text: 'text-accent-600', active: 'bg-accent-50 text-accent-700', hover: 'hover:bg-ink-100' },
    ink: { bg: 'bg-ink-900', text: 'text-ink-900', active: 'bg-ink-100 text-ink-900', hover: 'hover:bg-ink-100' },
  };
  const c = colorClasses[brandColor] || colorClasses.brand;

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar — desktop */}
      <aside className={`hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-ink-200 flex-col fixed inset-y-0 left-0 z-30`}>
        <SidebarContent navItems={navItems} user={user} c={c} onLogout={handleLogout} />
      </aside>

      {/* Sidebar — mobile */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-ink-950/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-ink-200 z-50 lg:hidden flex flex-col animate-slide-in-right">
            <SidebarContent navItems={navItems} user={user} c={c} onLogout={handleLogout} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-ink-200 sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-ink-100 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl bg-ink-100 w-64">
              <Search className="w-4 h-4 text-ink-400" />
              <input placeholder="Search..." className="bg-transparent text-sm outline-none flex-1 placeholder:text-ink-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`${location.pathname.split('/').slice(0, 2).join('/')}/notifications`)} className="relative p-2 rounded-lg hover:bg-ink-100 transition-colors">
              <Bell className="w-5 h-5 text-ink-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-ink-100 transition-colors">
                <Avatar src={user?.avatar || ''} emoji={user?.avatarEmoji} size="sm" />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-ink-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-ink-500">{user ? roleLabel[user.role] : ''}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-ink-400 hidden sm:block" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-card border border-ink-200 py-1 z-20 animate-scale-in">
                    <button onClick={() => { setProfileOpen(false); navigate(`${location.pathname.split('/').slice(0, 2).join('/')}/settings`); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ navItems, user, c, onLogout }: { navItems: NavItem[]; user: any; c: any; onLogout: () => void }) {
  const base = location.pathname.split('/')[1];
  return (
    <>
      <div className="h-16 flex items-center justify-between px-5 border-b border-ink-100">
        <NavLink to="/" className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center text-white font-bold text-sm`}>C</div>
          <span className="font-display font-bold text-lg text-ink-900">CreatorHub</span>
        </NavLink>
      </div>
      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === `/${base}` || item.to === `/${base}/`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? c.active : `text-ink-600 ${c.hover}`
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-xs bg-brand-500 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="p-3 border-t border-ink-100">
        <div className="flex items-center gap-3 p-2">
          <Avatar src={user?.avatar || ''} emoji={user?.avatarEmoji} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{user?.name}</p>
            <p className="text-xs text-ink-500 truncate">{user?.email}</p>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
