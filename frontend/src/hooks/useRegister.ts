import { useState } from 'react';
import { ApiClientError, apiFetch } from '../services/api';
import type { UserRole } from '../types';

interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

interface RegisterErrorState {
  status: number;
  code?: string;
  message: string;
  requestId?: string;
  timestamp: string;
}

interface RegisterState {
  isSubmitting: boolean;
  isError: boolean;
  errorMessage: RegisterErrorState | null;
}

export const useRegister = () => {
  const [state, setState] = useState<RegisterState>({
    isSubmitting: false,
    isError: false,
    errorMessage: null,
  });

  const register = async ({ email, password, name, role }: RegisterFormData): Promise<boolean> => {
    setState({ isSubmitting: true, isError: false, errorMessage: null });
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, name, role }),
      });

      setState({ isSubmitting: false, isError: false, errorMessage: null });
      return true;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setState({
          isSubmitting: false,
          isError: true,
          errorMessage: {
            status: err.info.status,
            code: err.info.code,
            message: err.info.message,
            requestId: err.info.requestId,
            timestamp: err.info.timestamp,
          },
        });
      } else {
        setState({
          isSubmitting: false,
          isError: true,
          errorMessage: {
            status: 0,
            code: 'UNKNOWN_ERROR',
            message: 'Error inesperado al registrar',
            timestamp: new Date().toISOString(),
          },
        });
      }
      return false;
    }
  };

  // Compatibilidad temporal con consumidores antiguos
  return {
    register,
    isSubmitting: state.isSubmitting,
    isError: state.isError,
    errorMessage: state.errorMessage,
    loading: state.isSubmitting,
    error: state.errorMessage?.message ?? null,
  };
};