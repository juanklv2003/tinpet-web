import type { MatchRequest } from '../../../hooks/useShelterMatches';
import { fmtDate } from '../helpers';

interface MatchesViewProps {
  matches: MatchRequest[];
  loading: boolean;
  error: string | null;
  onAccept: (matchId: string) => Promise<unknown>;
  onReject: (matchId: string) => Promise<unknown>;
}

export function MatchesView({ matches, loading, error, onAccept, onReject }: MatchesViewProps) {
  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
          Cargando solicitudes...
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-2">
          <span className="text-3xl">💌</span>
          <p>No hay solicitudes pendientes ahora mismo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {matches.map((match) => {
            const status = String(match.status ?? 'pending');
            const isPending = status === 'pending';
            const petName = String(match.pet_name ?? match.petName ?? match.pet_id ?? 'Mascota');
            const userName = String(match.user_name ?? match.userName ?? match.adopter_id ?? 'Usuario');

            return (
              <article
                key={match.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {userName} hizo like a {petName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {fmtDate(match.created_at) ?? 'Sin fecha'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : status === 'rejected'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  }`}>
                    {status === 'accepted' ? 'Aceptada' : status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!isPending}
                    onClick={() => {
                      void onAccept(match.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    disabled={!isPending}
                    onClick={() => {
                      void onReject(match.id);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Rechazar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
