import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, CreditCard, MessageSquare, Bell, Bookmark, User, Search, LogOut, Clapperboard, CirclePlay } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/context/ToastContext';
import { notificationService } from '@/services';

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/reels', label: 'Reels', icon: Clapperboard },
  { to: '/stories', label: 'Stories', icon: CirclePlay },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

const bottomNavItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/subscriptions', label: 'Subs', icon: CreditCard },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
];

export function UserShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    void notificationService.getUnreadCount(user.id).then(setUnreadNotifications).catch(() => setUnreadNotifications(0));
    return notificationService.subscribeToUser(user.id, (notification) => {
      if (!notification.read) setUnreadNotifications((count) => count + 1);
    });
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast('Signed out successfully', 'info');
      navigate('/login');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not sign out', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 pb-20 lg:pb-0">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-ink-200 bg-white">
        <NavLink to="/landing" className="flex h-14 items-center gap-2 border-b border-ink-100 px-5">
          <img src="/image-removebg-preview.png" alt="CreatorHub" className="h-8 w-8 rounded-lg" />
          <span className="font-display text-lg font-bold text-ink-900">CreatorHub</span>
        </NavLink>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'}`}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/bookmarks" className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'}`}>
            <Bookmark className="h-5 w-5" />
            Bookmarks
          </NavLink>
        </nav>
        <div className="border-t border-ink-100 p-3">
          <NavLink to="/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-ink-100">
            <Avatar src={user?.avatar || ''} emoji={user?.avatarEmoji} size="sm" />
            <span className="truncate text-sm font-semibold text-ink-900">{user?.name}</span>
          </NavLink>
        </div>
      </aside>
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/80 backdrop-blur-md lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <img src="/image-removebg-preview.png" alt="CreatorHub" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-bold text-lg text-ink-900 hidden sm:block">CreatorHub</span>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/bookmarks" className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
              }`
            }>
              <Bookmark className="w-4 h-4" />
              Bookmarks
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/explore')} className="p-2 rounded-lg hover:bg-ink-100 transition-colors lg:hidden">
              <Search className="w-5 h-5 text-ink-600" />
            </button>
            <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg hover:bg-ink-100 transition-colors lg:hidden">
              <Bell className="w-5 h-5 text-ink-600" />
              {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-brand-500 text-white text-[10px] leading-4 text-center rounded-full">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
            </button>
            <button onClick={() => navigate('/profile')} className="lg:hidden">
              <Avatar src={user?.avatar || ''} emoji={user?.avatarEmoji} size="sm" />
            </button>
            <button onClick={() => navigate('/profile')} className="hidden lg:block">
              <Avatar src={user?.avatar || ''} emoji={user?.avatarEmoji} size="md" ring />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-ink-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 lg:ml-64">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-ink-200 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/home' && location.pathname === '/');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                  isActive ? 'text-brand-600' : 'text-ink-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
