import { useEffect, useState } from 'react';
import { UsersThree, X, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { LoadingView } from '../../ui/LoadingView';
import type { ShelterEmployee } from '../../../hooks/useShelterEmployees';
import type { Pet } from '../../../types';
import { useTranslation } from '../../../i18n/useTranslation';

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
  const t = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<ShelterEmployee | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
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
      await onAddEmployee({ name: name.trim(), email: email.trim().toLowerCase(), role: role.trim() || undefined });
      setName(''); setEmail(''); setRole('');
    } finally {
      setSubmitting(false);
    }
  };

  const getPrimaryPhoto = (pet: Pet): string | null => {
    const fromArray = Array.isArray(pet.ai_profile?.photoUrls) ? pet.ai_profile.photoUrls[0] : null;
    const fromSingle = typeof pet.ai_profile?.photoUrl === 'string' ? pet.ai_profile.photoUrl : null;
    return fromArray || fromSingle || null;
  };

  const assignedPets = selectedEmployee
    ? pets.filter(p => p.ai_profile?.inChargeEmployeeId === selectedEmployee.id)
    : [];

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all";

  const totalPages = Math.max(1, Math.ceil(employees.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEmployees = employees.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  return (
    <section className="animate-bento-in relative">
      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif text-4xl md:text-5xl text-ink-dark dark:text-white leading-tight">
          {t('employees.title')}
        </h2>
        <p className="text-ink-medium dark:text-slate-400 mt-3 font-medium text-sm">
          {employees.length === 0
            ? t('employees.subtitle_zero')
            : employees.length === 1
              ? t('employees.subtitle_one', { count: 1 })
              : t('employees.subtitle_other', { count: employees.length })}
        </p>
      </header>

      {error && (
        <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Add employee form */}
        <div className="md:col-span-4 bento-item">
          <div className="bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento border border-white dark:border-slate-700 sticky top-10 transition-colors">
            <h4 className="font-serif text-xl text-ink-dark dark:text-white mb-6">
              {t('employees.addForm.title')}
            </h4>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t('employees.addForm.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('employees.addForm.namePlaceholder')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t('employees.addForm.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('employees.addForm.emailPlaceholder')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-wider mb-2">
                  {t('employees.addForm.role')}
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder={t('employees.addForm.rolePlaceholder')}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !email.trim()}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-sm shadow-brand-500/20 transition-colors mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? '...' : t('employees.addForm.submit')}
              </button>
            </form>
          </div>
        </div>

        {/* Employee list */}
        <div className="md:col-span-8 bento-item" style={{ animationDelay: '100ms' }}>
          {loading ? (
            <LoadingView message={t('common.loading')} minHeight="200px" />
          ) : employees.length === 0 ? (
            <div className="bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento border border-white dark:border-slate-700 h-full min-h-[400px] flex flex-col items-center justify-center text-center transition-colors">
              <div className="w-20 h-20 bg-background dark:bg-slate-900 rounded-full flex items-center justify-center text-ink-light dark:text-slate-500 mb-6">
                <UsersThree size={40} weight="fill" />
              </div>
              <h5 className="text-xl font-bold text-ink-dark dark:text-white mb-2">
                {t('employees.empty.title')}
              </h5>
              <p className="text-sm text-ink-medium dark:text-slate-400 max-w-sm">
                {t('employees.empty.subtitle')}
              </p>
            </div>
          ) : (
            <div className="bg-surface dark:bg-slate-800 rounded-3xl shadow-bento border border-white dark:border-slate-700 overflow-hidden transition-colors">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    {['Nombre', 'Email', 'Rol'].map(h => (
                      <th key={h} className="px-8 py-5 text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-widest border-b border-ink-light/10 dark:border-slate-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map(emp => (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="hover:bg-brand-50/30 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 font-bold text-sm shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-ink-dark dark:text-white group-hover:text-brand-600 transition-colors">
                            {emp.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50 text-sm font-medium text-ink-medium dark:text-slate-300">
                        {emp.email}
                      </td>
                      <td className="px-8 py-5 border-b border-ink-light/5 dark:border-slate-700/50 text-sm font-medium text-ink-medium dark:text-slate-300">
                        {String(emp.role ?? '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="px-8 py-5 border-t border-ink-light/10 dark:border-slate-700 flex items-center justify-between bg-surface dark:bg-slate-800">
                  <span className="text-sm font-medium text-ink-medium dark:text-slate-400">
                    Página {safeCurrentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-ink-light/20 dark:border-slate-600 text-ink-medium dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretLeft weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-ink-light/20 dark:border-slate-600 text-ink-medium dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretRight weight="bold" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Employee detail drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={handleClose}
            className={`absolute inset-0 bg-ink-dark/60 backdrop-blur-sm cursor-default transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className={`absolute right-3 top-3 bottom-3 w-[min(calc(100%-1.5rem),28rem)] bg-surface dark:bg-slate-800 border border-ink-light/10 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out flex flex-col ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="px-8 py-6 border-b border-ink-light/10 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif text-xl text-ink-dark dark:text-white">Detalle del empleado</h3>
                <p className="text-xs text-ink-light dark:text-slate-500 mt-1">Información y asignaciones</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-10 h-10 rounded-full hover:bg-background dark:hover:bg-slate-700 flex items-center justify-center text-ink-medium dark:text-slate-400 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 dash-scroll space-y-8">
              <div className="space-y-4 bg-background dark:bg-slate-900 p-5 rounded-2xl border border-ink-light/10 dark:border-slate-700">
                {[
                  { label: 'Nombre', value: selectedEmployee.name },
                  { label: 'Email', value: selectedEmployee.email },
                  { label: 'Rol', value: String(selectedEmployee.role ?? '—') },
                ].map(item => (
                  <div key={item.label}>
                    <label className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-widest">{item.label}</label>
                    <p className="text-sm font-bold text-ink-dark dark:text-white mt-1">{item.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-widest mb-4">
                  Mascotas a su cargo ({assignedPets.length})
                </h4>
                {assignedPets.length === 0 ? (
                  <p className="text-sm text-ink-light dark:text-slate-400 italic">Sin mascotas asignadas.</p>
                ) : (
                  <div className="space-y-3">
                    {assignedPets.map(pet => {
                      const photo = getPrimaryPhoto(pet);
                      return (
                        <div key={pet.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-ink-light/10 dark:border-slate-700">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-background dark:bg-slate-800 shrink-0">
                            {photo
                              ? <img src={photo} alt={pet.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-ink-light text-lg">🐾</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-ink-dark dark:text-white truncate">{pet.name}</p>
                            <p className="text-xs text-ink-light dark:text-slate-400">
                              {pet.species}{pet.ai_profile?.breed ? ` · ${pet.ai_profile.breed}` : ''}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${pet.status === 'available' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : pet.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
                            {pet.status === 'available' ? 'Disponible' : pet.status === 'pending' ? 'Pendiente' : 'Adoptado'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-5 border-t border-ink-light/10 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-medium dark:text-slate-300 hover:bg-background dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
