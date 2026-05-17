import { useEffect, useMemo, useState } from 'react';
import {
  PawPrint,
  Heart,
  CheckCircle,
  TrendUp,
  Plus,
  X,
} from '@phosphor-icons/react';
import { LoadingView } from '../../ui/LoadingView';
import type { ShelterStats } from '../../../hooks/useShelterStats';
import type { Pet } from '../../../types';
import { daysSince, fmtDate } from '../helpers';
import { useTranslation } from '../../../i18n/useTranslation';
import { useAuth } from '../../../context/AuthContext';

interface MonitoringViewProps {
  pets: Pet[];
  error: string | null;
  stats?: ShelterStats;
  statsLoading?: boolean;
  statsError?: string | null;
}

type DashboardTask = {
  id: string;
  title: string;
  description?: string;
  count?: number;
  details?: string[];
};

export function MonitoringView({
  pets,
  error,
  stats,
  statsLoading = false,
  statsError = null,
}: MonitoringViewProps) {
  const t = useTranslation();
  const { user } = useAuth();

  const hasAnyPhoto = (pet: Pet) => {
    const photoUrls = pet.ai_profile?.photoUrls;
    if (Array.isArray(photoUrls) && photoUrls.length > 0) return true;
    return Boolean(pet.ai_profile?.photoUrl);
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const tasksStorageKey = `tinpet-daily-tasks-${todayKey}`;
  const customTasksStorageKey = `tinpet-custom-tasks-${todayKey}`;

  const totalPets = stats?.totalPets ?? pets.length;
  const totalLikesReceived = stats?.totalLikesReceived ?? 0;
  const closedAdoptions = stats?.closedAdoptions ?? pets.filter(p => p.status === 'adopted').length;
  const adoptedPets = pets.filter(p => p.status === 'adopted').length;
  const adoptionRate = totalPets > 0 ? Math.round((adoptedPets / totalPets) * 100) : 0;

  const incompleteProfiles = pets.filter(p => !hasAnyPhoto(p) || !p.ai_profile?.breed).slice(0, 5);
  const staleAvailablePets = pets
    .filter(p => p.status === 'available')
    .map(p => ({ pet: p, age: daysSince(p.created_at) ?? 0 }))
    .filter(i => i.age >= 45)
    .sort((a, b) => b.age - a.age)
    .slice(0, 5);
  const longPendingPets = pets
    .filter(p => p.status === 'pending')
    .map(p => ({ pet: p, age: daysSince(p.created_at) ?? 0 }))
    .filter(i => i.age >= 14)
    .sort((a, b) => b.age - a.age)
    .slice(0, 5);
  const recentActivity = [...pets]
    .sort((a, b) => {
      const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bT - aT;
    })
    .slice(0, 6);

  const dailyTasks = useMemo<DashboardTask[]>(() => [
    {
      id: 'incomplete-profiles',
      title: t('monitoring.tasks.completeForms', { count: incompleteProfiles.length }),
      description: t('monitoring.tasks.completeFormsDesc'),
      count: incompleteProfiles.length,
      details: incompleteProfiles.slice(0, 3).map(p => p.name),
    },
    {
      id: 'stale-available',
      title: t('monitoring.tasks.validateAdmissions', { count: staleAvailablePets.length }),
      description: t('monitoring.tasks.validateAdmissionsDesc'),
      count: staleAvailablePets.length,
      details: staleAvailablePets.slice(0, 3).map(i => i.pet.name),
    },
    {
      id: 'new-intakes',
      title: t('monitoring.tasks.validateAdmissions', { count: pets.filter(p => (daysSince(p.created_at) ?? 999) <= 7).length }),
      description: t('monitoring.tasks.validateAdmissionsDesc'),
      count: pets.filter(p => (daysSince(p.created_at) ?? 999) <= 7).length,
      details: recentActivity.slice(0, 3).map(p => p.name),
    },
    {
      id: 'long-pending',
      title: t('monitoring.tasks.validateAdmissions', { count: longPendingPets.length }),
      description: t('monitoring.tasks.completeFormsDesc'),
      count: longPendingPets.length,
      details: longPendingPets.slice(0, 3).map(i => i.pet.name),
    },
  ], [incompleteProfiles, staleAvailablePets, longPendingPets, pets, recentActivity, t]);

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [customTasks, setCustomTasks] = useState<DashboardTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(tasksStorageKey);
      if (raw) setCompletedTasks(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [tasksStorageKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(customTasksStorageKey);
      if (raw) setCustomTasks(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [customTasksStorageKey]);

  useEffect(() => {
    try { localStorage.setItem(tasksStorageKey, JSON.stringify(completedTasks)); } catch { /* ignore */ }
  }, [completedTasks, tasksStorageKey]);

  useEffect(() => {
    try { localStorage.setItem(customTasksStorageKey, JSON.stringify(customTasks)); } catch { /* ignore */ }
  }, [customTasks, customTasksStorageKey]);

  const allTasks = useMemo<DashboardTask[]>(() => [...dailyTasks, ...customTasks], [dailyTasks, customTasks]);
  const completedCount = allTasks.filter(task => completedTasks[task.id]).length;

  if (statsLoading) {
    return <LoadingView message={t('common.loading')} />;
  }

  const kpis = [
    {
      label: t('monitoring.kpi.totalPets'),
      value: statsLoading ? '...' : String(totalPets),
      icon: <PawPrint size={18} weight="fill" />,
      accent: false,
    },
    {
      label: t('monitoring.kpi.likes'),
      value: statsLoading ? '...' : String(totalLikesReceived),
      icon: <Heart size={18} weight="fill" />,
      accent: true,
    },
    {
      label: t('monitoring.kpi.adoptions'),
      value: statsLoading ? '...' : String(closedAdoptions),
      icon: <CheckCircle size={18} weight="fill" />,
      accent: false,
    },
    {
      label: t('monitoring.kpi.adoptionRate'),
      value: `${adoptionRate}%`,
      icon: <TrendUp size={18} weight="fill" />,
      accent: false,
    },
  ];

  return (
    <section className="animate-bento-in">
      {/* Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="bento-item">
          <p className="text-brand-500 font-bold tracking-widest uppercase text-xs mb-3">
            {t('monitoring.panel')}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink-dark dark:text-white leading-tight">
            {t('monitoring.title')}
          </h2>
          <p className="text-ink-medium dark:text-slate-400 mt-3 font-medium text-sm max-w-md">
            {t('monitoring.subtitle')}
          </p>
        </div>
        <div className="bento-item flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-ink-dark dark:text-white">{user?.name}</p>
            <p className="text-xs font-medium text-ink-light dark:text-slate-500">{t('auth.admin')}</p>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden border border-ink-light/20 dark:border-slate-700 bg-surface flex items-center justify-center bg-brand-100 dark:bg-brand-500/20 text-brand-500 font-bold text-lg shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
        </div>
      </header>

      {/* Errors */}
      {error && (
        <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">
          {error}
        </p>
      )}
      {statsError && (
        <p className="mb-6 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-2xl">
          {statsError}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        {/* KPIs */}
        <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-6 bento-item">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className={`bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento hover:shadow-bento-hover transition-all duration-300 border dark:border-slate-700 relative overflow-hidden ${
                kpi.accent ? 'border-white' : 'border-white'
              }`}
            >
              {kpi.accent && (
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-50 dark:bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
              )}
              <div className="flex justify-between items-start mb-6 relative z-10">
                <p className={`text-xs font-bold uppercase tracking-wider ${kpi.accent ? 'text-brand-600 dark:text-brand-400' : 'text-ink-light dark:text-slate-400'}`}>
                  {kpi.label}
                </p>
                <span className={kpi.accent ? 'text-brand-500' : 'text-ink-light dark:text-slate-500'}>
                  {kpi.icon}
                </span>
              </div>
              <h3 className={`font-serif text-4xl relative z-10 ${kpi.accent ? 'text-brand-600 dark:text-brand-400' : 'text-ink-dark dark:text-white'}`}>
                {kpi.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Tasks panel */}
        <div className="md:col-span-8 bento-item" style={{ animationDelay: '100ms' }}>
          <div className="bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento border border-white dark:border-slate-700 transition-colors h-full">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h4 className="font-serif text-xl text-ink-dark dark:text-white mb-1">
                  {t('monitoring.tasks.title')}
                </h4>
                <p className="text-sm text-ink-light dark:text-slate-400 font-medium">
                  {t('monitoring.tasks.subtitle', { done: completedCount, count: allTasks.length })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setCompletedTasks({}); setCustomTasks([]); }}
                className="text-xs font-bold text-ink-light dark:text-slate-500 hover:text-brand-500 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Add custom task */}
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newTaskTitle.trim()) return;
                const id = `custom-task-${Date.now()}`;
                setCustomTasks(prev => [...prev, { id, title: newTaskTitle }]);
                setNewTaskTitle('');
              }}
              className="flex gap-3 mb-6"
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Nueva tarea personalizada..."
                className="flex-1 bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shrink-0 transition-colors"
              >
                <Plus size={18} weight="bold" />
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allTasks.map(task => {
                const done = Boolean(completedTasks[task.id]);
                const isCustom = task.id.startsWith('custom-task-');
                return (
                  <label
                    key={task.id}
                    className="flex items-start gap-4 p-5 rounded-2xl border border-ink-light/10 dark:border-slate-700 hover:border-brand-500/30 dark:hover:border-brand-500/50 hover:bg-brand-50/30 dark:hover:bg-slate-700 transition-all cursor-pointer group relative"
                  >
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        className="editorial-checkbox"
                        checked={done}
                        onChange={e => setCompletedTasks(prev => ({ ...prev, [task.id]: e.target.checked }))}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold transition-colors ${done ? 'line-through text-ink-light dark:text-slate-500' : 'text-ink-dark dark:text-white group-hover:text-brand-900 dark:group-hover:text-brand-300'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-ink-light dark:text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                      )}
                      {task.details && task.details.length > 0 && (
                        <p className="text-xs font-medium text-ink-medium dark:text-slate-300 mt-1 truncate">
                          Ej: {task.details.join(', ')}
                        </p>
                      )}
                    </div>
                    {isCustom && (
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          setCustomTasks(prev => prev.filter(t => t.id !== task.id));
                          setCompletedTasks(prev => { const n = { ...prev }; delete n[task.id]; return n; });
                        }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-ink-light hover:text-red-500 transition-all"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="md:col-span-4 bento-item" style={{ animationDelay: '150ms' }}>
          <div className="bg-surface dark:bg-slate-800 rounded-3xl p-8 shadow-bento border border-white dark:border-slate-700 h-full transition-colors">
            <h4 className="font-serif text-xl text-ink-dark dark:text-white mb-6">
              Actividad reciente
            </h4>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-ink-light dark:text-slate-400">Sin actividad registrada.</p>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map(pet => (
                  <li key={pet.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background dark:bg-slate-900 overflow-hidden shrink-0 border border-ink-light/10 dark:border-slate-700">
                        {hasAnyPhoto(pet) ? (
                          <img
                            src={pet.ai_profile?.photoUrls?.[0] ?? pet.ai_profile?.photoUrl ?? ''}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-light dark:text-slate-500">
                            <PawPrint size={16} weight="fill" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-bold text-ink-dark dark:text-white truncate">{pet.name}</span>
                    </div>
                    <span className="text-xs text-ink-light dark:text-slate-500 whitespace-nowrap">
                      {fmtDate(pet.created_at) ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Alert cards */}
        {staleAvailablePets.length > 0 && (
          <div className="md:col-span-4 bento-item" style={{ animationDelay: '200ms' }}>
            <div className="bg-amber-50/60 dark:bg-amber-900/10 rounded-3xl p-6 border border-amber-200/60 dark:border-amber-700/40 h-full">
              <h5 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3 uppercase tracking-wider">
                Disponibles &gt;45 días
              </h5>
              <ul className="space-y-2">
                {staleAvailablePets.map(item => (
                  <li key={item.pet.id} className="text-sm text-amber-900 dark:text-amber-200">
                    <span className="font-semibold">{item.pet.name}</span> — {item.age} días
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {longPendingPets.length > 0 && (
          <div className="md:col-span-4 bento-item" style={{ animationDelay: '250ms' }}>
            <div className="bg-orange-50/60 dark:bg-orange-900/10 rounded-3xl p-6 border border-orange-200/60 dark:border-orange-700/40 h-full">
              <h5 className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-3 uppercase tracking-wider">
                Pendientes &gt;14 días
              </h5>
              <ul className="space-y-2">
                {longPendingPets.map(item => (
                  <li key={item.pet.id} className="text-sm text-orange-900 dark:text-orange-200">
                    <span className="font-semibold">{item.pet.name}</span> — {item.age} días
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {incompleteProfiles.length > 0 && (
          <div className="md:col-span-4 bento-item" style={{ animationDelay: '300ms' }}>
            <div className="bg-blue-50/60 dark:bg-blue-900/10 rounded-3xl p-6 border border-blue-200/60 dark:border-blue-700/40 h-full">
              <h5 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 uppercase tracking-wider">
                Perfiles incompletos
              </h5>
              <ul className="space-y-2">
                {incompleteProfiles.map(pet => (
                  <li key={pet.id} className="text-sm text-blue-900 dark:text-blue-200">
                    <span className="font-semibold">{pet.name}</span>
                    {!hasAnyPhoto(pet) && ' · sin foto'}
                    {!pet.ai_profile?.breed && ' · sin raza'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
