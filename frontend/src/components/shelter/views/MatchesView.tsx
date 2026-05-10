import { useMemo, useState, useRef, useEffect } from 'react';
import type { MatchRequest } from '../../../hooks/useShelterMatches';
import { AdopterInfoModal } from '../modals/AdopterInfoModal';
import { fmtDate } from '../helpers';
import { Heart, Search } from 'lucide-react';
import { API_BASE_URL } from '../../../services/api';

interface MatchesViewProps {
  matches: MatchRequest[];
  loading: boolean;
  error: string | null;
  onAccept: (matchId: string) => Promise<unknown>;
  onReject: (matchId: string) => Promise<unknown>;
}

const normalizeImageUrl = (url: unknown): string | null => {
  if (typeof url !== 'string' || !url.trim()) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  if (/^[A-Za-z0-9+/=]+$/.test(url) && url.length > 100) {
    return `data:image/jpeg;base64,${url}`;
  }
  return `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;
};

const extractStringFromCandidate = (candidate: unknown): string | null => {
  if (typeof candidate === 'string') return candidate.trim() || null;
  if (!candidate || typeof candidate !== 'object') return null;
  // common shapes: { url }, { path }, { src }
  const maybe = (candidate as Record<string, unknown>);
  for (const key of ['url', 'path', 'src', 'value']) {
    const v = maybe[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
};

const getAdopterPhoto = (adopter: any): string | null => {
  try {
    console.log('[DEBUG] MatchesView.getAdopterPhoto', {
      id: adopter?.id ?? adopter?.user_id,
      avatar_url: adopter?.avatar_url,
      photos: adopter?.photos,
    });
  } catch (e) {
    // swallow logging errors
  }
  const photos = Array.isArray(adopter?.photos) ? adopter.photos : [];

  for (const candidateRaw of photos) {
    const candidate = extractStringFromCandidate(candidateRaw);
    const normalized = normalizeImageUrl(candidate);
    if (normalized) return normalized;
  }

  // fallback order: explicit avatar_url, legacy fields
  const avatar = normalizeImageUrl(extractStringFromCandidate(adopter?.avatar_url) ?? adopter?.avatar_url);
  if (avatar) return avatar;

  for (const field of ['photo', 'image_url', 'picture', 'avatar']) {
    const val = extractStringFromCandidate(adopter?.[field]) ?? adopter?.[field];
    const n = normalizeImageUrl(val);
    if (n) return n;
  }

  // if avatar_url is a raw base64 string (legacy), handle it explicitly
  if (typeof adopter?.avatar_url === 'string' && adopter.avatar_url.length > 100 && !adopter.avatar_url.startsWith('data:')) {
    return `data:image/jpeg;base64,${adopter.avatar_url}`;
  }

  return null;
};

export function MatchesView({ matches, loading, error, onAccept, onReject }: MatchesViewProps) {
  const [selectedMatch, setSelectedMatch] = useState<MatchRequest | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;
  
  // --- Status dropdown component (inline) ---
  const statusOptions: { value: 'all' | 'pending' | 'accepted' | 'rejected'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'accepted', label: 'Aceptadas' },
    { value: 'rejected', label: 'Rechazadas' },
  ];

  function StatusDropdown({ value, onChange }: { value: string; onChange: (v: any) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      function onDoc(e: MouseEvent) {
        if (!ref.current) return;
        if (!ref.current.contains(e.target as Node)) setOpen(false);
      }
      document.addEventListener('click', onDoc);
      return () => document.removeEventListener('click', onDoc);
    }, []);

    const currentLabel = statusOptions.find((o) => o.value === value)?.label ?? 'Todos';

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-2 text-sm"
        >
          <span className="text-sm dark:text-gray-300">{currentLabel}</span>
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-300" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg" role="listbox">
            {statusOptions.map((opt) => {
              const selected = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={
                      `w-full px-3 py-2 text-left text-sm transition-colors ${selected ? 'bg-brand/10 text-brand dark:bg-brand/15 dark:text-brand' : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'}`
                    }
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  const handleAccept = async (matchId: string) => {
    setAcceptingId(matchId);
    try {
      await onAccept(matchId);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (matchId: string) => {
    setRejectingId(matchId);
    try {
      await onReject(matchId);
    } finally {
      setRejectingId(null);
    }
  };

  // Filter + search + pagination
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches.filter((m) => {
      const adopterName = String(m.user_name ?? (m.adopter as any)?.name ?? '').toLowerCase();
      const adopterUser = String(m.adopter?.username ?? (m.adopter as any)?.user_name ?? '').toLowerCase();
      const petName = String(m.pet_name ?? '').toLowerCase();
      
      const matchesQuery = !q || adopterName.includes(q) || adopterUser.includes(q) || petName.includes(q);
      if (!matchesQuery) return false;
      
      if (statusFilter !== 'all' && String(m.status) !== statusFilter) return false;
      return true;
    });
  }, [matches, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleSetStatus = (s: 'all' | 'pending' | 'accepted' | 'rejected') => {
    setStatusFilter(s);
    setPage(1);
  };

  const handleSearch = (v: string) => {
    setQuery(v);
    setPage(1);
  };

  return (
      <div className="space-y-6">
        <div className="mb-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-start">
        <div className="relative w-full xl:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o mascota..."
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm dark:placeholder-gray-300 dark:text-gray-300"
          />
        </div>
        <div className="w-full xl:w-56 relative xl:ml-2">
          {/* Custom dropdown to match provided design */}
          <StatusDropdown
            value={statusFilter}
            onChange={(v) => handleSetStatus(v)}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
          Cargando solicitudes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm gap-2">
          <Heart className="w-8 h-8 text-brand" />
          <p>No hay solicitudes pendientes ahora mismo.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pageItems.map((match) => {
            const status = String(match.status ?? 'pending');
            const isPending = status === 'pending';
            const petName = String(match.pet_name ?? match.petName ?? match.pet_id ?? 'Mascota');
            const adopter = match.adopter;
            const userName = String(adopter?.username || adopter?.user_name || match.user_name || match.userName || match.adopter_id || 'Usuario');
            const photoUrl = adopter ? getAdopterPhoto(adopter) : null;

            return (
              <article
                key={match.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMatch(match)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedMatch(match);
                  }
                }}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Header con foto */}
                    <div className="relative h-28 bg-transparent flex items-center justify-center">
                  {photoUrl ? (
                    <img
                          src={photoUrl}
                          alt={userName}
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                  <div className="w-20 h-20 rounded-full bg-brand/10 border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center">
                          <span className="text-xl font-bold text-brand">
                        {userName?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    </div>
                  )}
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : status === 'rejected'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    }`}
                  >
                    {status === 'accepted' ? 'Aceptada' : status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                  </span>
                </div>

                {/* Contenido */}
                <div className="p-4">
                  {/* Nombre */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {userName}
                  </h3>

                  {/* Like a mascota */}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Le gustó <span className="font-semibold">{petName}</span>
                  </p>

                  {/* Descripción */}
                  {adopter?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                      {adopter.description}
                    </p>
                  )}

                  {/* Fecha */}
                  {match.created_at && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {fmtDate(match.created_at) ?? 'Sin fecha'}
                    </p>
                  )}

                  {/* Botones */}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={!isPending || acceptingId === match.id || rejectingId === match.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleAccept(match.id);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {acceptingId === match.id ? 'Aceptando...' : 'Aceptar'}
                    </button>
                    <button
                      type="button"
                      disabled={!isPending || acceptingId === match.id || rejectingId === match.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleReject(match.id);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-transparent border border-brand text-brand hover:bg-brand/8 disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {rejectingId === match.id ? 'Rechazando...' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              </article>
            );
            })}
          </div>

          {/* Pagination controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500">Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-brand text-brand bg-white dark:bg-gray-800 dark:border-brand dark:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color] hover:bg-brand/8 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >Anterior</button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-brand text-white' : 'bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-brand hover:text-brand'}`}
                    >{p}</button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-brand text-brand bg-white dark:bg-gray-800 dark:border-brand dark:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition-[background-color] hover:bg-brand/8 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >Siguiente</button>
            </div>
          </div>
        </>
      )}

      {/* Modal de información del adoptante */}
      {selectedMatch && (
        <AdopterInfoModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
