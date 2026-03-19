import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export interface ShelterEmployee {
  id: string;
  shelter_id: string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface CreateEmployeePayload {
  name: string;
  email: string;
  role?: string;
}

interface UseShelterEmployeesResult {
  employees: ShelterEmployee[];
  loading: boolean;
  error: string | null;
  fetchEmployees: () => Promise<void>;
  handleAddEmployee: (payload: CreateEmployeePayload) => Promise<ShelterEmployee | null>;
}

interface UseShelterEmployeesOptions {
  autoFetch?: boolean;
}

export function useShelterEmployees(options?: UseShelterEmployeesOptions): UseShelterEmployeesResult {
  const autoFetch = options?.autoFetch ?? true;
  const [employees, setEmployees] = useState<ShelterEmployee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ShelterEmployee[]>('/api/employees');
      setEmployees(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los empleados';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddEmployee = useCallback(async (payload: CreateEmployeePayload) => {
    setLoading(true);
    setError(null);
    try {
      const created = await apiFetch<ShelterEmployee>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setEmployees((prev) => [created, ...prev]);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el empleado';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    void fetchEmployees();
  }, [autoFetch, fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    handleAddEmployee,
  };
}
