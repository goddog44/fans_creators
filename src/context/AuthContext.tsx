import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, Role } from '@/types';
import { authService } from '@/services';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: Role }) => Promise<User>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'creatorhub-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        authService.setCurrentUser(parsed);
        setUser(parsed);
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, []);

  const persist = (u: User | null) => {
    if (u) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(STORAGE_KEY);
  };

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    persist(u);
    return u;
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; role: Role }) => {
    const u = await authService.register(data);
    setUser(u);
    persist(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    persist(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    await authService.resetPassword(token, password);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      persist(next);
      authService.setCurrentUser(next);
      return next;
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
