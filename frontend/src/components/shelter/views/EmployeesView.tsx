import { useState } from 'react';
import type { ShelterEmployee } from '../../../hooks/useShelterEmployees';

interface EmployeesViewProps {
  employees: ShelterEmployee[];
  loading: boolean;
  error: string | null;
  onAddEmployee: (payload: { name: string; email: string; role?: string }) => Promise<unknown>;
}

export function EmployeesView({ employees, loading, error, onAddEmployee }: EmployeesViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      await onAddEmployee({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim() || undefined,
      });
      setName('');
      setEmail('');
      setRole('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Nuevo empleado</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
          />
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Rol (opcional)"
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
          />
        </div>
        <div className="mt-3">
          <button
            type="submit"
            disabled={submitting || !name.trim() || !email.trim()}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Guardando...' : 'Añadir empleado'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Cargando empleados...</div>
      ) : employees.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">No hay empleados registrados.</div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{employee.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{employee.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{String(employee.role ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
