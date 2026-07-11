import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services';
import { tokenStore } from '../api/client';
import type { User } from '../types';
import { isDemoMode } from '../config/demo';
import { demoUser } from '../demo/demoAccount';
interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = useCallback(async () => {
    if (isDemoMode && sessionStorage.getItem('three-n-demo-session') === 'true') {
      setUser(demoUser);
      setLoading(false);
      return;
    }
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
      setLoading(false);
      return;
    }
    try {
      setUser((await authService.profile()).data);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshUser();
    const expired = () => {
      setUser(null);
      tokenStore.clear();
    };
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [refreshUser]);
  const login = async (email: string, password: string) => {
    const { data } = await authService.login({ email, password });
    tokenStore.set(data.access, data.refresh);
    setUser(data.user);
  };
  const logout = async () => {
    if (isDemoMode && sessionStorage.getItem('three-n-demo-session') === 'true') {
      sessionStorage.removeItem('three-n-demo-session');
      setUser(null);
      return;
    }
    try {
      await authService.logout(tokenStore.getRefresh());
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  };
  const demoLogin = () => {
    if (!isDemoMode) return;
    sessionStorage.setItem('three-n-demo-session', 'true');
    setUser(demoUser);
  };
  const value = useMemo(
    () => ({ user, loading, login, demoLogin, logout, refreshUser }),
    [user, loading, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('AuthProvider manquant');
  return c;
}
