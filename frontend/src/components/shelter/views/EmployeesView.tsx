import { useEffect, useState } from 'react';
import type { ShelterEmployee } from '../../../hooks/useShelterEmployees';
import type { Pet } from '../../../types';

interface EmployeesViewProps {
  employees: ShelterEmployee[];
  pets?: Pet[];
  loading: boolean;
  error: string | null;
  onAddEmployee: (payload: { name: string; email: string; role?: string }) => Promise<unknown>;
}

export function EmployeesView({
  employees,
  pets = [],
  loading,
  error,
  onAddEmployee,
}: EmployeesViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<ShelterEmployee | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const ANIMATION_MS = 280;

  useEffect(() => {
    if (selectedEmployee) {
      const rafId = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(rafId);
    } else {
      setIsVisible(false);
    }
  }, [selectedEmployee]);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(() => setSelectedEmployee(null), ANIMATION_MS);
  };

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

  const getPrimaryPhoto = (pet: Pet): string | null => {
    const fromArray = Array.isArray(pet.ai_profile?.photoUrls) ? pet.ai_profile.photoUrls[0] : null;
    const fromSingle = typeof pet.ai_profile?.photoUrl === 'string' ? pet.ai_profile.photoUrl : null;
    return fromArray || fromSingle || null;
  };

  // Filtrar las mascotas de las cuales este empleado es el encargado
  const assignedPets = selectedEmployee
    ? pets.filter(p => p.ai_profile?.inChargeEmployeeId === selectedEmployee.id)
    : [];

  return (
    <div className="relative">
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
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-pink-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-pink-500"
            />
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Rol (opcional)"
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-pink-500"
            />
          </div>
          <div className="mt-3">
            <button
              type="submit"
              disabled={submitting || !name.trim() || !email.trim()}
              className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
            <table className="w-full select-none">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    onClick={() => {
                      setSelectedEmployee(employee);
                    }}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition duration-100"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {employee.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {employee.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {String(employee.role ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flyout Drawer lateral derecho */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end select-none">
          {/* Overlay oscuro para cerrar */}
          <button
            type="button"
            aria-label="Cerrar detalle"
            onClick={handleClose}
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default transition-opacity duration-300 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Panel Lateral */}
          <div
            className={`absolute right-3 top-3 bottom-3 w-[calc(100%-1.5rem)] sm:w-[min(calc(100%-1.5rem),28rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out flex flex-col justify-between p-6 ${
              isVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="overflow-y-auto flex-1 pr-1">
              {/* Encabezado */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detalle del empleado
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Información detallada y asignaciones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition duration-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info Empleado */}
              <div className="space-y-4 bg-gray-50/50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80 mb-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Nombre
                  </label>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                    {selectedEmployee.name}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Email
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                    {selectedEmployee.email}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Rol
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                    {String(selectedEmployee.role ?? '—')}
                  </p>
                </div>
              </div>

              {/* Mascotas a cargo */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Mascotas a su cargo ({assignedPets.length})
                </h4>

                {assignedPets.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-2">
                    No tiene ninguna mascota asignada actualmente.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {assignedPets.map(pet => {
                      const primaryPhoto = getPrimaryPhoto(pet);
                      return (
                        <div
                          key={pet.id}
                          className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {primaryPhoto ? (
                              <img
                                src={primaryPhoto}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-400 select-none">🐾</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {pet.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {pet.species} {pet.ai_profile?.breed ? `• ${pet.ai_profile.breed}` : ''}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              pet.status === 'available'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40'
                                : pet.status === 'pending'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40'
                                : 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-100 dark:border-sky-800/40'
                            }`}
                          >
                            {pet.status === 'available'
                              ? 'Disponible'
                              : pet.status === 'pending'
                              ? 'Pendiente'
                              : 'Adoptado'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pie del Panel */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
