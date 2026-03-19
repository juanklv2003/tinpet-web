import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  setAuth: () => {},
  logout: () => {},
});

function parseToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.sub, email: payload.email, role: payload.role, name: payload.name ?? '' };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setUser(parseToken(token));
    setLoading(false);
  }, []);

  const setAuth = (authUser: AuthUser, token: string) => {
    localStorage.setItem('token', token);
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);