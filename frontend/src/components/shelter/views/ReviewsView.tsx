import { useEffect, useState } from 'react';
import { Star } from '@phosphor-icons/react';
import { apiFetch, API_BASE_URL } from '../../../services/api';
import { LoadingView } from '../../ui/LoadingView';
import { useTranslation } from '../../../i18n/useTranslation';

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewsResponse {
  reviews: Review[];
  averageRating: number | null;
  totalCount: number;
}

const getAvatarUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}/${url.startsWith('/') ? url.slice(1) : url}`;
};

const Stars = ({ rating, size = 18 }: { rating: number; size?: number }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={size}
        weight={s <= rating ? 'fill' : 'regular'}
        className={s <= rating ? 'text-amber-400' : 'text-ink-light dark:text-slate-600'}
      />
    ))}
  </div>
);

export function ReviewsView() {
  const t = useTranslation();
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiFetch<ReviewsResponse>('/api/reviews/me/received');
      setData(res);
    } catch (err: any) {
      setError(err.info?.message || 'Error al cargar las valoraciones.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const calcDist = (reviews: Review[]) => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating]++; });
    return dist;
  };

  if (isLoading) return <LoadingView message={t('common.loading')} />;

  const { reviews = [], averageRating, totalCount } = data ?? {};
  const distribution = calcDist(reviews);

  return (
    <section className="animate-bento-in max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif text-4xl md:text-5xl text-ink-dark dark:text-white leading-tight">
          {t('reviews.title')}
        </h2>
        <p className="text-ink-medium dark:text-slate-400 mt-3 font-medium text-sm">
          {t('reviews.subtitle')}
        </p>
      </header>

      {error && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-surface dark:bg-slate-800 rounded-3xl border border-white dark:border-slate-700 shadow-bento p-10">
          <p className="text-ink-medium dark:text-slate-400 mb-6">{error}</p>
          <button
            type="button"
            onClick={fetchReviews}
            className="px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!error && totalCount === 0 && (
        <div className="bg-surface dark:bg-slate-800 rounded-3xl shadow-bento border border-white dark:border-slate-700 p-16 text-center bento-item transition-colors">
          <Star size={56} className="mx-auto text-ink-light dark:text-slate-600 mb-5" />
          <h3 className="font-serif text-xl text-ink-dark dark:text-white mb-2">
            {t('reviews.empty')}
          </h3>
          <p className="text-sm text-ink-medium dark:text-slate-400">
            Las valoraciones de los adoptantes aparecerán aquí.
          </p>
        </div>
      )}

      {!error && totalCount !== 0 && (
        <div className="space-y-8">
          {/* Rating summary card */}
          <div className="bg-surface dark:bg-slate-800 rounded-3xl shadow-bento border border-white dark:border-slate-700 p-8 flex flex-col md:flex-row gap-10 items-center bento-item transition-colors">
            {/* Average score */}
            <div className="flex flex-col items-center shrink-0">
              <span className="font-serif text-7xl text-ink-dark dark:text-white">
                {averageRating?.toFixed(1) ?? '0.0'}
              </span>
              <div className="my-3">
                <Stars rating={Math.round(averageRating ?? 0)} size={24} />
              </div>
              <span className="text-sm font-bold text-ink-light dark:text-slate-500">
                {totalCount} valoraci{totalCount === 1 ? 'ón' : 'ones'}
              </span>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 w-full space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = distribution[rating] ?? 0;
                const pct = totalCount! > 0 ? (count / totalCount!) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-4 text-sm font-bold">
                    <span className="w-4 text-ink-medium dark:text-slate-400">{rating}</span>
                    <Star size={14} weight="fill" className="text-amber-400 shrink-0" />
                    <div className="flex-1 h-2.5 bg-background dark:bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-ink-light dark:text-slate-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-5">
            {reviews.map((review, i) => (
              <div
                key={review.id}
                className="bg-surface dark:bg-slate-800 rounded-3xl shadow-bento border border-white dark:border-slate-700 p-8 bento-item transition-all hover:shadow-bento-hover"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-100 dark:bg-brand-500/20 shrink-0">
                      {getAvatarUrl(review.reviewer_avatar) ? (
                        <img src={getAvatarUrl(review.reviewer_avatar)!} alt={review.reviewer_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-500 font-bold text-lg">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-ink-dark dark:text-white">{review.reviewer_name}</h4>
                      <span className="text-xs text-ink-light dark:text-slate-500">
                        {new Date(review.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="text-ink-medium dark:text-slate-300 italic text-sm leading-relaxed bg-background dark:bg-slate-900 p-5 rounded-2xl border border-ink-light/10 dark:border-slate-700">
                    "{review.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
