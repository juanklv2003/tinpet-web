import { useState } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AuthUser, UserRole } from '../types';

interface LoginResponse {
  token: string;
  role: UserRole;
  name: string;
}

export const useLogin = () => {
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const authUser: AuthUser = {
        id: parseJwtSub(data.token),
        email: email.trim().toLowerCase(),
        role: data.role,
        name: data.name,
      };
      setAuth(authUser, data.token);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

function parseJwtSub(token: string): string {
  try { return JSON.parse(atob(token.split('.')[1])).sub; }
  catch { return ''; }
}