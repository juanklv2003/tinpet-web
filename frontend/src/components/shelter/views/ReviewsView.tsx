import React, { useEffect, useState } from 'react';
import { apiFetch, API_BASE_URL } from '../../../services/api';
import { Star } from 'lucide-react';
import { LoadingView } from '../../ui/LoadingView';

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

export function ReviewsView() {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<ReviewsResponse>('/api/reviews/me/received');
      setData(data);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.info?.message || 'Error al cargar las valoraciones.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Prefix relative paths with API base URL
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
  };

  const renderStars = (rating: number, size = 16) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateDistribution = (reviews: Review[]) => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating as keyof typeof dist]++;
      }
    });
    return dist;
  };

  if (isLoading) {
    return <LoadingView message="Cargando valoraciones..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchReviews}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { reviews = [], averageRating, totalCount } = data || {};
  const distribution = calculateDistribution(reviews);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {totalCount === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Star size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aún no tienes valoraciones</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Las valoraciones de los adoptantes aparecerán aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="flex flex-col items-center">
              <span className="text-6xl font-bold text-gray-900 dark:text-white">
                {averageRating?.toFixed(1) || '0.0'}
              </span>
              <div className="my-3">
                {renderStars(Math.round(averageRating || 0), 24)}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {totalCount} valoraci{totalCount === 1 ? 'ón' : 'ones'}
              </span>
            </div>

            <div className="flex-1 w-full space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as keyof typeof distribution];
                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-4 text-sm font-medium">
                    <span className="w-4 text-gray-600 dark:text-gray-400">{rating}</span>
                    <Star size={16} className="text-gray-400 dark:text-gray-500" />
                    <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="w-8 text-right text-gray-500 dark:text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md dark:hover:shadow-gray-900/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      {getAvatarUrl(review.reviewer_avatar) ? (
                        <img 
                          src={getAvatarUrl(review.reviewer_avatar)!} 
                          alt={review.reviewer_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-bold text-lg">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{review.reviewer_name}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.created_at).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    {renderStars(review.rating)}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

