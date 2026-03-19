import { useEffect, useMemo, useState } from 'react';
import { fmtDate, daysSince } from '../helpers';
import type { Pet } from '../../../types';
import type { ShelterStats } from '../../../hooks/useShelterStats';

interface MonitoringViewProps {
  pets: Pet[];
  error: string | null;
  stats?: ShelterStats;
  statsLoading?: boolean;
  statsError?: string | null;
}

export function MonitoringView({
  pets,
  error,
  stats,
  statsLoading = false,
  statsError = null,
}: MonitoringViewProps) {
  const todayKey = new Date().toISOString().split('T')[0];
  const tasksStorageKey = `tinpet-daily-tasks-${todayKey}`;

  const totalPets = stats?.totalPets ?? pets.length;
  const totalLikesReceived = stats?.totalLikesReceived ?? 0;
  const closedAdoptions = stats?.closedAdoptions ?? pets.filter(pet => pet.status === 'adopted').length;
  const availablePets = pets.filter(pet => pet.status === 'available').length;
  const pendingPets = pets.filter(pet => pet.status === 'pending').length;
  const adoptedPets = pets.filter(pet => pet.status === 'adopted').length;
  const adoptionRate =
    totalPets > 0 ? Math.round((adoptedPets / totalPets) * 100) : 0;

  const staleAvailablePets = pets
    .filter(pet => pet.status === 'available')
    .map(pet => ({ pet, age: daysSince(pet.created_at) ?? 0 }))
    .filter(item => item.age >= 45)
    .sort((a, b) => b.age - a.age)
    .slice(0, 5);

  const longPendingPets = pets
    .filter(pet => pet.status === 'pending')
    .map(pet => ({ pet, age: daysSince(pet.created_at) ?? 0 }))
    .filter(item => item.age >= 14)
    .sort((a, b) => b.age - a.age)
    .slice(0, 5);

  const incompleteProfiles = pets
    .filter(pet => !pet.ai_profile?.photoUrl || !pet.ai_profile?.breed)
    .slice(0, 5);

  const recentActivity = [...pets]
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  const statusDistribution = [
    { key: 'available', label: 'Disponibles', value: availablePets, color: 'bg-emerald-500' },
    { key: 'pending', label: 'Pendientes', value: pendingPets, color: 'bg-amber-500' },
    { key: 'adopted', label: 'Adoptadas', value: adoptedPets, color: 'bg-sky-500' },
  ] as const;

  const dailyTasks = useMemo(() => {
    const tasks = [
      {
        id: 'incomplete-profiles',
        title: 'Completar fichas incompletas',
        description: 'Mascotas sin foto o sin raza.',
        count: incompleteProfiles.length,
        details: incompleteProfiles.slice(0, 3).map(p => p.name),
      },
      {
        id: 'stale-available',
        title: 'Revisar estancias largas',
        description: 'Mascotas disponibles durante mas de 45 dias.',
        count: staleAvailablePets.length,
        details: staleAvailablePets.slice(0, 3).map(item => item.pet.name),
      },
      {
        id: 'long-pending',
        title: 'Cerrar pendientes antiguos',
        description: 'Procesos pendientes durante mas de 14 dias.',
        count: longPendingPets.length,
        details: longPendingPets.slice(0, 3).map(item => item.pet.name),
      },
      {
        id: 'new-intakes',
        title: 'Validar altas recientes',
        description: 'Mascotas dadas de alta en los ultimos 7 dias.',
        count: pets.filter(pet => (daysSince(pet.created_at) ?? 999) <= 7).length,
        details: recentActivity.slice(0, 3).map(p => p.name),
      },
    ];

    return tasks;
  }, [incompleteProfiles, staleAvailablePets, longPendingPets, pets, recentActivity]);

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(tasksStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setCompletedTasks(parsed);
        return;
      }
    } catch {
      // ignore broken localStorage content
    }
    setCompletedTasks({});
  }, [tasksStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(tasksStorageKey, JSON.stringify(completedTasks));
    } catch {
      // ignore persistence errors
    }
  }, [completedTasks, tasksStorageKey]);

  const completedCount = dailyTasks.filter(task => completedTasks[task.id]).length;

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}
      {statsError && (
        <p className="text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg">
          {statsError}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            Total mascotas
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {statsLoading ? '...' : totalPets}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            Likes recibidos
          </p>
          <p className="text-3xl font-bold text-emerald-500 mt-2">
            {statsLoading ? '...' : totalLikesReceived}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            Adopciones cerradas
          </p>
          <p className="text-3xl font-bold text-amber-500 mt-2">{statsLoading ? '...' : closedAdoptions}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            Tasa adopcion
          </p>
          <p className="text-3xl font-bold text-sky-500 mt-2">{adoptionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 lg:p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">
            Distribucion por estado
          </h3>
          <div className="space-y-4">
            {statusDistribution.map(item => {
              const pct =
                totalPets > 0 ? Math.round((item.value / totalPets) * 100) : 0;
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.value} ({pct}%)
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Actividad reciente
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">Sin actividad registrada.</p>
          ) : (
            <ul className="space-y-2.5">
              {recentActivity.map(pet => (
                <li
                  key={pet.id}
                  className="text-sm text-gray-700 dark:text-gray-200 flex items-start justify-between gap-3"
                >
                  <span className="truncate">{pet.name}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(pet.created_at) ?? 'Sin fecha'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-3 rounded-2xl border border-violet-200/60 dark:border-violet-700/40 bg-violet-50/60 dark:bg-violet-900/10 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                Tareas del dia
              </h3>
              <p className="text-xs text-violet-700/80 dark:text-violet-300/80 mt-1">
                {completedCount} de {dailyTasks.length} tareas marcadas para hoy.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCompletedTasks({})}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-300/60 dark:border-violet-600/50 text-violet-900 dark:text-violet-200 hover:bg-violet-100/70 dark:hover:bg-violet-900/30"
            >
              Reiniciar checklist
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dailyTasks.map(task => {
              const done = Boolean(completedTasks[task.id]);
              return (
                <label
                  key={task.id}
                  className="flex items-start gap-3 rounded-xl border border-violet-200/60 dark:border-violet-700/40 bg-white/80 dark:bg-gray-900/40 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={e => {
                      const checked = e.target.checked;
                      setCompletedTasks(prev => ({ ...prev, [task.id]: checked }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {task.title} ({task.count})
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {task.description}
                    </p>
                    {task.details.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                        Ejemplos: {task.details.join(', ')}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-700/40 bg-amber-50/60 dark:bg-amber-900/10 p-5">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">
            Alertas: disponibles antiguas
          </h3>
          {staleAvailablePets.length === 0 ? (
            <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
              Todo correcto. No hay casos por encima de 45 dias.
            </p>
          ) : (
            <ul className="space-y-2">
              {staleAvailablePets.map(item => (
                <li
                  key={item.pet.id}
                  className="text-sm text-amber-900 dark:text-amber-200"
                >
                  {item.pet.name} lleva {item.age} dias disponible.
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-orange-200/60 dark:border-orange-700/40 bg-orange-50/60 dark:bg-orange-900/10 p-5">
          <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-3">
            Alertas: pendientes largas
          </h3>
          {longPendingPets.length === 0 ? (
            <p className="text-sm text-orange-700/80 dark:text-orange-300/80">
              No hay pendientes por encima de 14 dias.
            </p>
          ) : (
            <ul className="space-y-2">
              {longPendingPets.map(item => (
                <li
                  key={item.pet.id}
                  className="text-sm text-orange-900 dark:text-orange-200"
                >
                  {item.pet.name} lleva {item.age} dias en pendiente.
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-blue-200/60 dark:border-blue-700/40 bg-blue-50/60 dark:bg-blue-900/10 p-5">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
            Perfiles incompletos
          </h3>
          {incompleteProfiles.length === 0 ? (
            <p className="text-sm text-blue-700/80 dark:text-blue-300/80">
              Todas las fichas tienen foto y raza.
            </p>
          ) : (
            <ul className="space-y-2">
              {incompleteProfiles.map(pet => (
                <li key={pet.id} className="text-sm text-blue-900 dark:text-blue-200">
                  {pet.name}: {!pet.ai_profile?.photoUrl && 'falta foto'}
                  {!pet.ai_profile?.photoUrl && !pet.ai_profile?.breed && ', '}
                  {!pet.ai_profile?.breed && 'falta raza'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
