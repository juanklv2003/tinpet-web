import { useMemo, useState, useRef, useEffect } from 'react';
import { Heart, MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
import type { MatchRequest } from '../../../hooks/useShelterMatches';
import { AdopterInfoModal } from '../modals/AdopterInfoModal';
import { fmtDate } from '../helpers';
import { API_BASE_URL } from '../../../services/api';
import { LoadingView } from '../../ui/LoadingView';
import { useTranslation } from '../../../i18n/useTranslation';

interface MatchesViewProps {
  matches: MatchRequest[];
  loading: boolean;
  error: string | null;
  onAccept: (matchId: string) => Promise<unknown>;
  onReject: (matchId: string) => Promise<unknown>;
}

const normalizeImageUrl = (url: unknown): string | null => {
  if (typeof url !== 'string' || !url.trim()) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  if (/^[A-Za-z0-9+/=]+$/.test(url) && url.length > 100) return `data:image/jpeg;base64,${url}`;
  return `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;
};

const extractStringFromCandidate = (candidate: unknown): string | null => {
  if (typeof candidate === 'string') return candidate.trim() || null;
  if (!candidate || typeof candidate !== 'object') return null;
  const maybe = (candidate as Record<string, unknown>);
  for (const key of ['url', 'path', 'src', 'value']) {
    const v = maybe[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
};

const getAdopterPhoto = (adopter: any): string | null => {
  const photos = Array.isArray(adopter?.photos) ? adopter.photos : [];
  for (const candidateRaw of photos) {
    const normalized = normalizeImageUrl(extractStringFromCandidate(candidateRaw));
    if (normalized) return normalized;
  }
  const avatar = normalizeImageUrl(extractStringFromCandidate(adopter?.avatar_url) ?? adopter?.avatar_url);
  if (avatar) return avatar;
  for (const field of ['photo', 'image_url', 'picture', 'avatar']) {
    const n = normalizeImageUrl(extractStringFromCandidate(adopter?.[field]) ?? adopter?.[field]);
    if (n) return n;
  }
  if (typeof adopter?.avatar_url === 'string' && adopter.avatar_url.length > 100 && !adopter.avatar_url.startsWith('data:')) {
    return `data:image/jpeg;base64,${adopter.avatar_url}`;
  }
  return null;
};

const STATUS_COLORS: Record<string, string> = {
  accepted: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  rejected:  'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  pending:   'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
};

export function MatchesView({ matches, loading, error, onAccept, onReject }: MatchesViewProps) {
  const t = useTranslation();
  const [selectedMatch, setSelectedMatch] = useState<MatchRequest | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

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
      const onDoc = (e: MouseEvent) => {
        if (!ref.current?.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('click', onDoc);
      return () => document.removeEventListener('click', onDoc);
    }, []);
    const currentLabel = statusOptions.find(o => o.value === value)?.label ?? 'Todos';
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(s => !s)}
          className="w-full text-left px-4 py-3 rounded-xl border border-ink-light/20 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
        >
          <span>{currentLabel}</span>
          <CaretDown size={16} className="text-ink-light" />
        </button>
        {open && (
          <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-ink-light/20 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-bento-hover" role="listbox">
            {statusOptions.map(opt => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${opt.value === value ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-900 dark:text-brand-400 font-bold' : 'text-ink-dark dark:text-white hover:bg-brand-50/50 dark:hover:bg-slate-800'}`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const handleAccept = async (matchId: string) => {
    setAcceptingId(matchId);
    try { await onAccept(matchId); } finally { setAcceptingId(null); }
  };
  const handleReject = async (matchId: string) => {
    setRejectingId(matchId);
    try { await onReject(matchId); } finally { setRejectingId(null); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches.filter(m => {
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

  return (
    <section className="animate-bento-in">
      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif text-4xl md:text-5xl text-ink-dark dark:text-white leading-tight">
          {t('requests.title')}
        </h2>
        <p className="text-ink-medium dark:text-slate-400 mt-3 font-medium text-sm">
          {t('requests.subtitle')}
        </p>
      </header>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder={t('pets.searchPlaceholder')}
            className="w-full bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
          />
        </div>
        <div className="w-full sm:w-48">
          <StatusDropdown value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} />
        </div>
      </div>

      {error && (
        <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">{error}</p>
      )}

      {loading ? (
        <LoadingView message={t('common.loading')} minHeight="200px" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-surface dark:bg-slate-800 rounded-3xl border border-white dark:border-slate-700 shadow-bento">
          <Heart size={40} weight="fill" className="text-brand-500/30 mb-4" />
          <p className="text-sm font-medium text-ink-medium dark:text-slate-400">{t('requests.empty')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {pageItems.map(match => {
              const status = String(match.status ?? 'pending');
              const isPending = status === 'pending';
              const petName = String(match.pet_name ?? match.petName ?? match.pet_id ?? 'Mascota');
              const adopter = match.adopter;
              const userName = String(adopter?.username || adopter?.user_name || match.user_name || match.userName || match.adopter_id || 'Usuario');
              const photoUrl = adopter ? getAdopterPhoto(adopter) : null;

              return (
                <article
                  key={match.id}
                  className="relative rounded-3xl overflow-hidden bg-surface dark:bg-slate-800 border border-ink-light/10 dark:border-slate-700 shadow-bento hover:shadow-bento-hover transition-all duration-300 flex flex-col bento-item cursor-pointer"
                  onClick={() => setSelectedMatch(match)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedMatch(match); } }}
                >
                  <div className="p-6 text-center">
                    {/* Status badge */}
                    <span className={`absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>
                      {status === 'accepted' ? 'Aceptada' : status === 'rejected' ? 'Rechazada' : t('requests.new')}
                    </span>

                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full mx-auto border-4 border-background dark:border-slate-900 overflow-hidden shadow-sm mt-4 mb-4">
                      {photoUrl ? (
                        <img src={photoUrl} alt={userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 font-bold text-2xl">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <h6 className="text-xl font-bold text-ink-dark dark:text-white">{userName}</h6>
                    <p className="text-xs font-bold text-brand-500 mt-1 uppercase tracking-wider">
                      {t('requests.likedPet', { petName })}
                    </p>

                    {adopter?.description && (
                      <p className="text-sm text-ink-medium dark:text-slate-300 italic mt-4 line-clamp-3">
                        "{adopter.description}"
                      </p>
                    )}

                    {match.created_at && (
                      <p className="text-xs text-ink-light dark:text-slate-500 mt-4">
                        {fmtDate(match.created_at) ?? '—'}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="p-4 border-t border-ink-light/10 dark:border-slate-700 grid grid-cols-2 gap-3 mt-auto">
                    <button
                      type="button"
                      disabled={!isPending || acceptingId === match.id || rejectingId === match.id}
                      onClick={e => { e.stopPropagation(); void handleReject(match.id); }}
                      className="py-3 rounded-xl text-xs font-bold border border-ink-light/20 dark:border-slate-600 text-ink-medium dark:text-slate-300 hover:bg-background dark:hover:bg-slate-700 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {rejectingId === match.id ? '...' : t('common.reject')}
                    </button>
                    <button
                      type="button"
                      disabled={!isPending || acceptingId === match.id || rejectingId === match.id}
                      onClick={e => { e.stopPropagation(); void handleAccept(match.id); }}
                      className="py-3 rounded-xl text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {acceptingId === match.id ? '...' : t('common.accept')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-ink-light dark:text-slate-500 font-medium">
                Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-dark dark:text-white hover:border-brand-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${p === page ? 'bg-brand-500 text-white' : 'border border-ink-light/20 dark:border-slate-600 text-ink-dark dark:text-white hover:border-brand-500'}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-ink-light/20 dark:border-slate-600 text-sm font-bold text-ink-dark dark:text-white hover:border-brand-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedMatch && (
        <AdopterInfoModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </section>
  );
}
