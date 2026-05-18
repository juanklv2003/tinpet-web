import { useEffect, useState, useMemo } from 'react';
import { IconX } from '../Icons';
import type { MatchRequest } from '../../../hooks/useShelterMatches';
import { API_BASE_URL } from '../../../services/api';
import { useTranslation } from '../../../i18n/useTranslation';

interface AdopterInfoModalProps {
  match: MatchRequest;
  onClose: () => void;
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
  const maybe = (candidate as Record<string, unknown>);
  for (const key of ['url', 'path', 'src', 'value']) {
    const v = maybe[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
};

export function AdopterInfoModal({ match, onClose }: AdopterInfoModalProps) {
  const t = useTranslation();
  const adopter = match.adopter ?? {
    id: match.adopter_id,
    name: match.user_name ?? t('adopter.modal.defaultUser'),
    email: '',
    phone: '',
    photos: [],
    description: '',
  };

  const photos = useMemo(() => {
    const arr: string[] = [];
    if (Array.isArray(adopter.photos) && adopter.photos.length > 0) {
      adopter.photos.forEach((p) => {
        const candidate = extractStringFromCandidate(p);
        const norm = normalizeImageUrl(candidate);
        if (norm && !arr.includes(norm)) arr.push(norm);
      });
    } else {
      const av = normalizeImageUrl(adopter.avatar_url);
      if (av && !arr.includes(av)) arr.push(av);
    }
    return arr;
  }, [adopter.photos, adopter.avatar_url]);

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const username =
    (typeof adopter.username === 'string' && adopter.username.trim()) ||
    (typeof adopter.user_name === 'string' && adopter.user_name.trim()) ||
    t('adopter.modal.defaultUser');
  const realName =
    (typeof adopter.name === 'string' && adopter.name.trim()) ||
    (typeof match.user_name === 'string' && match.user_name.trim()) ||
    username;
  const ANIMATION_MS = 280;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsVisible(false);
        window.setTimeout(onClose, ANIMATION_MS);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(onClose, ANIMATION_MS);
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={handleClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className={`absolute right-3 top-3 flex w-[calc(100%-1.5rem)] sm:w-[32rem] h-auto max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-gray-700 dark:bg-gray-900 ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header con foto (Carrusel cuadrado) */}
        <div className="relative h-64 sm:h-72 bg-black/90 flex items-center justify-center overflow-hidden">
          {photos.length > 0 ? (
            <img
              src={photos[activePhotoIndex]}
              alt={`${adopter.name} - ${t('pets.modal.add.photoLabel')} ${activePhotoIndex + 1}`}
              onClick={() => handleNextPhoto()}
              className="w-full h-full object-contain select-none cursor-pointer hover:opacity-95 transition-opacity"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-4xl text-gray-600 dark:text-gray-400">
                {adopter.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}

          {/* Flechas del carrusel */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors flex items-center justify-center z-10"
                aria-label={t('adopter.modal.prevPhoto')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors flex items-center justify-center z-10"
                aria-label={t('adopter.modal.nextPhoto')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Indicadores de fotos */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex(i);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === activePhotoIndex ? 'bg-brand shadow' : 'bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors z-20"
          >
            <IconX />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 pb-8">
          {/* Username y nombre real */}
          <div className="mb-4">
            <h2 className="text-3xl font-black text-black dark:text-white">
              {username}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold">{t('adopter.modal.fullName')}:</span> {realName}
            </p>
            {adopter.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-semibold">{t('adopter.modal.email')}:</span> {adopter.email}
              </p>
            )}
            {adopter.phone && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">{t('adopter.modal.phone')}:</span> {adopter.phone}
              </p>
            )}
          </div>

          {/* Descripción */}
          {adopter.description && (
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('adopter.modal.aboutMe')}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {adopter.description}
              </p>
            </div>
          )}

          {/* Información de vivienda */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t('adopter.modal.housing')}
            </p>
            <div className="space-y-1">
              {adopter.housing_type && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{t('adopter.modal.housingType')}:</span> {adopter.housing_type === 'house' ? t('adopter.modal.housingHouse') : t('adopter.modal.housingApartment')}
                </p>
              )}
              {adopter.work_from_home !== undefined && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{t('adopter.modal.workFromHome')}:</span> {adopter.work_from_home ? t('common.yes') : t('common.no')}
                </p>
              )}
              {adopter.hours_at_home && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{t('adopter.modal.hoursAtHome')}:</span>{' '}
                  {adopter.hours_at_home === 'less4'
                    ? t('adopter.modal.hoursLess4')
                    : adopter.hours_at_home === '4to8'
                      ? t('adopter.modal.hours4to8')
                      : adopter.hours_at_home === 'more8'
                        ? t('adopter.modal.hoursMore8')
                        : t('adopter.modal.hoursAlways')}
                </p>
              )}
            </div>
          </div>

          {/* Experiencia y mascotas */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {t('adopter.modal.petExperience')}
            </p>
            <div className="space-y-1">
              {adopter.pet_experience && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{t('adopter.modal.experience')}:</span>{' '}
                  {adopter.pet_experience === 'none'
                    ? t('adopter.modal.experienceNone')
                    : adopter.pet_experience === 'some'
                      ? t('adopter.modal.experienceSome')
                      : t('adopter.modal.experienceHigh')}
                </p>
              )}
              {adopter.has_other_pets !== undefined && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{t('adopter.modal.hasOtherPets')}:</span> {adopter.has_other_pets ? t('common.yes') : t('common.no')}
                </p>
              )}
              {adopter.has_other_pets && adopter.other_pets_desc && (
                <div className="mt-1 pl-3 border-l-2 border-pink-200 dark:border-pink-800/40">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('adopter.modal.otherPetsDetails')}:</p>
                  {Array.isArray(adopter.other_pets_desc) ? (
                    <ul className="list-disc list-inside pl-1 text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                      {adopter.other_pets_desc.map((pet, idx) => (
                        <li key={idx}>{pet}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{adopter.other_pets_desc}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Familia */}
          {adopter.has_children !== undefined && (
            <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('adopter.modal.family')}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{t('adopter.modal.hasChildren')}:</span> {adopter.has_children ? t('common.yes') : t('common.no')}
              </p>
              
              {adopter.has_children && (adopter.kids_count !== undefined || (adopter.kids_ages && adopter.kids_ages.length > 0)) && (
                <div className="mt-2 pl-3 border-l-2 border-blue-200 dark:border-blue-800/40 space-y-1.5">
                  {adopter.kids_count !== undefined && adopter.kids_count > 0 && (
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t('adopter.modal.kidsCount')}: <span className="font-bold">{adopter.kids_count}</span>
                    </p>
                  )}
                  {Array.isArray(adopter.kids_ages) && adopter.kids_ages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('adopter.modal.ages')}:</span>
                      {adopter.kids_ages.map((age, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800">
                          {age} {age === 1 ? t('adopter.modal.ageYear_one') : t('adopter.modal.ageYear_other')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hobbies */}
          {adopter.hobbies && adopter.hobbies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('adopter.modal.interests')}
              </p>
              <div className="flex flex-wrap gap-2">
                {adopter.hobbies.map((hobby, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-[#B94188]/10 dark:bg-[#B94188]/20 text-[#B94188] text-xs font-medium"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
