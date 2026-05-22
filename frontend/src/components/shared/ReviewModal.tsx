import { useState } from 'react';
import { Star, X } from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';

interface ReviewModalProps {
  matchId: string;
  targetId: string;
  targetRole: string;
  targetName: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ReviewModal({ matchId, targetId, targetRole, targetName, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Por favor, selecciona una valoración (estrellas).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          target_id: targetId,
          target_role: targetRole,
          match_id: matchId,
          rating,
          comment,
        }),
      });
      onSuccess(`Has valorado exitosamente a ${targetName}`);
      onClose();
    } catch (err: any) {
      setError(err.info?.message || err.message || 'Error al enviar la valoración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleIn relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-serif font-bold text-ink-dark dark:text-white">
            Valorar a {targetName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-ink-light dark:text-slate-400 hover:text-ink-dark dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-ink-medium dark:text-slate-300 mb-6 text-center">
            ¿Cómo fue tu experiencia de adopción con {targetName}?
          </p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
              >
                <Star
                  size={40}
                  weight={(hoveredRating || rating) >= star ? "fill" : "regular"}
                  className={(hoveredRating || rating) >= star ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}
                />
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-wider mb-2">
              Comentario (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deja un comentario sobre tu experiencia..."
              rows={4}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-ink-dark dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none transition-all"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-sm text-red-600 dark:text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-ink-medium dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="px-6 py-2.5 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-95"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar valoración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
