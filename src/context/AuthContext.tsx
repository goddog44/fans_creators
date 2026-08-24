import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { authService } from '@/services';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from Supabase session
  useEffect(() => {
    let disposed = false;
    let syncVersion = 0;

    const syncSession = (session: { user: { id: string } } | null, clearWhenMissing = false) => {
      const version = ++syncVersion;

      if (!session?.user) {
        if (!disposed) {
          if (clearWhenMissing) setUser(null);
          setLoading(false);
        }
        return;
      }

      void authService.getUserProfile(session.user.id).then((currentUser) => {
        if (!disposed && version === syncVersion) {
          setUser((previousUser) => currentUser || previousUser);
          setLoading(false);
        }
      }).catch((error) => {
        if (!disposed && version === syncVersion) {
          console.error('Failed to fetch user profile:', error);
          setLoading(false);
        }
      });
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session, _event === 'SIGNED_OUT' || _event === 'INITIAL_SESSION');
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!disposed) syncSession(data.session, true);
    }).catch((error) => {
      if (!disposed) {
        console.error('Failed to initialize auth:', error);
        setLoading(false);
      }
    });

    return () => {
      disposed = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string }) => {
    const u = await authService.register(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (password: string) => {
    await authService.resetPassword(password);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const hasRole = useCallback((...roles: Role[]) => {
    return user !== null && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, forgotPassword, resetPassword, updateUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}