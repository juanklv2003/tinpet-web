import { useRef, useState, useEffect } from 'react';
import { Star } from '@phosphor-icons/react';
import {
  MapPin,
  InstagramLogo,
  FacebookLogo,
  YoutubeLogo,
  TiktokLogo,
  Globe,
  Stethoscope,
  Phone,
  PencilSimple,
  ArrowLeft,
  Envelope,
  FloppyDisk,
  Heart,
  Sparkle,
  Camera
} from '@phosphor-icons/react';
import type { VetProfileForm } from '../types';
import { PhotoCropModal } from '../../shared/PhotoCropModal';
import { useTranslation } from '../../../i18n/useTranslation';
import { useShelterStats } from '../../../hooks/useShelterStats';
import { useShelterEmployees } from '../../../hooks/useShelterEmployees';
import { apiFetch } from '../../../services/api';

const Stars = ({ rating, size = 18 }: { rating: number; size?: number }) => (
  <div className="flex gap-1 items-center justify-center">
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

interface VetProfileViewProps {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  profileForm: VetProfileForm;
  profileDirty: boolean;
  profileSaveMsg: string | null;
  profileError: string | null;
  onUpdateField: (field: keyof VetProfileForm, value: string) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCropCancel: () => void;
  onCropConfirm: (croppedBlob: Blob) => void;
  cropImageSrc: string | null;
  onSave: () => void;
}

export function VetProfileView({
  profileForm,
  profileDirty,
  profileSaveMsg,
  profileError,
  onUpdateField,
  onPhotoSelect,
  onCropCancel,
  onCropConfirm,
  cropImageSrc,
  onSave,
}: VetProfileViewProps) {
  const t = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);

  const { stats } = useShelterStats({ autoFetch: true });
  const { employees } = useShelterEmployees({ autoFetch: true });

  const [ratingData, setRatingData] = useState<{ average: number | null; total: number }>({ average: null, total: 0 });

  useEffect(() => {
    apiFetch<any>('/api/reviews/me/received')
      .then(res => setRatingData({ average: res.averageRating, total: res.totalCount }))
      .catch(console.error);
  }, []);

  // Only close the editor after a full profile save, NOT after a photo upload.
  useEffect(() => {
    const SAVE_MESSAGES = ['Perfil guardado correctamente.', 'Profile saved successfully.'];
    if (profileSaveMsg && !profileError && SAVE_MESSAGES.some(m => profileSaveMsg.includes(m))) {
      const timer = setTimeout(() => {
        setIsEditing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [profileSaveMsg, profileError]);

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-3 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-wider mb-2";
  const sectionTitleClass = "text-sm font-bold text-ink-dark dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-2 flex items-center gap-2";

  const socialLinks = [
    { key: 'instagram' as keyof VetProfileForm, icon: <InstagramLogo size={20} />, label: 'Instagram', value: profileForm.instagram, href: profileForm.instagram || null, color: 'text-pink-600' },
    { key: 'facebook' as keyof VetProfileForm, icon: <FacebookLogo size={20} />, label: 'Facebook', value: profileForm.facebook, href: profileForm.facebook || null, color: 'text-blue-600' },
    { key: 'youtube' as keyof VetProfileForm, icon: <YoutubeLogo size={20} />, label: 'YouTube', value: profileForm.youtube, href: profileForm.youtube || null, color: 'text-red-600' },
    { key: 'tiktok' as keyof VetProfileForm, icon: <TiktokLogo size={20} />, label: 'TikTok', value: profileForm.tiktok, href: profileForm.tiktok || null, color: 'text-slate-800 dark:text-white' },
    { key: 'website' as keyof VetProfileForm, icon: <Globe size={20} />, label: 'Sitio Web', value: profileForm.website, href: profileForm.website || null, color: 'text-brand-500' },
  ];

  if (isEditing) {
    return (
      <section className="animate-bento-in max-w-3xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-2 text-ink-light dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors text-sm font-semibold mb-2 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              {t('common.back') || 'Volver al perfil'}
            </button>
            <h2 className="font-serif text-3xl text-ink-dark dark:text-white">
              {t('profile.vet.modalTitle') || 'Editar Perfil de la Clínica'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800/60 text-ink-medium dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              {t('common.cancel') || 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!profileDirty}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-brand-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
            >
              <FloppyDisk size={18} weight="bold" />
              {t('profile.common.saveChanges') || 'Guardar'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoSelect}
            className="hidden"
          />

          {/* Datos Básicos */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6">
            <h3 className={sectionTitleClass}>
              <Stethoscope size={18} className="text-brand-500" /> 
              {t('profile.common.basicData') || 'Datos Básicos'}
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-6 mt-6">
              <div className="shrink-0 flex flex-col items-center">
                <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope size={48} className="text-slate-300 dark:text-slate-600" />
                  )}
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1"
                  >
                    <Camera size={24} />
                    <span className="text-xs font-bold">Cambiar</span>
                  </button>
                </div>
              </div>
              
              <div className="grow space-y-4 w-full">
                <div>
                  <label className={labelClass}>{t('profile.vet.nameLabel') || 'Nombre de la Clínica Veterinaria'}</label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={e => onUpdateField('displayName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('profile.common.email') || 'Email (Público)'}</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => onUpdateField('email', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6">
            <h3 className={sectionTitleClass}>
              <Heart size={18} className="text-brand-500" />
              {t('profile.common.description') || 'Descripción'}
            </h3>
            <textarea
              rows={5}
              value={profileForm.description}
              onChange={e => onUpdateField('description', e.target.value)}
              placeholder="Describe la clínica, servicios, especialidades y equipo médico..."
              className={inputClass + " resize-y mt-2"}
            />
          </div>

          {/* Contacto */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6">
            <h3 className={sectionTitleClass}>
              <Phone size={18} className="text-brand-500" />
              {t('profile.common.contact') || 'Contacto'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className={labelClass}>{t('profile.common.location') || 'Ubicación'}</label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={e => onUpdateField('location', e.target.value)}
                  placeholder="Ej. Madrid, España"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t('profile.common.phoneLabel') || 'Teléfono de Contacto'}</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => onUpdateField('phone', e.target.value)}
                  placeholder="+34 ..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Redes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6">
            <h3 className={sectionTitleClass}>
              <Globe size={18} className="text-brand-500" />
              {t('profile.common.socialNetworks') || 'Redes y Web'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>{t('profile.common.websiteLabel') || 'Sitio Web Oficial'}</label>
                <input
                  type="text"
                  value={profileForm.website}
                  onChange={e => onUpdateField('website', e.target.value)}
                  placeholder="https://miclinicavet.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Instagram</label>
                <input
                  type="text"
                  value={profileForm.instagram}
                  onChange={e => onUpdateField('instagram', e.target.value)}
                  placeholder="https://instagram.com/..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Facebook</label>
                <input
                  type="text"
                  value={profileForm.facebook}
                  onChange={e => onUpdateField('facebook', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>TikTok</label>
                <input
                  type="text"
                  value={profileForm.tiktok}
                  onChange={e => onUpdateField('tiktok', e.target.value)}
                  placeholder="https://tiktok.com/..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>YouTube</label>
                <input
                  type="text"
                  value={profileForm.youtube}
                  onChange={e => onUpdateField('youtube', e.target.value)}
                  placeholder="https://youtube.com/..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {profileError && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
              {profileError}
            </div>
          )}
          {profileSaveMsg && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-900/30 animate-pulse">
              {profileSaveMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800/60 text-ink-medium dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              {t('common.cancel') || 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!profileDirty}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md shadow-brand-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
            >
              <FloppyDisk size={18} weight="bold" />
              {t('profile.common.saveChanges') || 'Guardar cambios'}
            </button>
          </div>
        </div>

        {cropImageSrc && (
          <PhotoCropModal
            imageSrc={cropImageSrc}
            onCancel={onCropCancel}
            onConfirm={onCropConfirm}
          />
        )}
      </section>
    );
  }

  return (
    <>
      <section className="animate-bento-in max-w-5xl mx-auto pb-12">
      {/* 1. Header con Avatar, Nombre, Badge e Info básica */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/60 transition-all p-6 md:p-8 flex flex-col items-center justify-center gap-6 relative z-10 overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-500/10 to-transparent dark:from-brand-500/5 -z-10" />
        
        <div className="flex justify-center z-10">
          <div className="p-1 rounded-full border-2 border-slate-200 dark:border-slate-700/80 shadow-sm transition-colors">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 relative">
              {profileForm.avatarUrl ? (
                <img src={profileForm.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <Stethoscope size={48} className="text-slate-400 dark:text-slate-600" />
              )}
            </div>
          </div>
        </div>

        <div className="text-center pt-2 max-w-2xl z-10 flex flex-col items-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {profileForm.displayName || t('profile.vet.title') || 'Tu clínica'}
          </h2>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-600 border border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-400 dark:border-brand-900/30 uppercase tracking-wider shadow-sm flex items-center justify-center">
              <Sparkle size={12} className="mr-1" weight="fill" />
              {t('profile.vet.badge') || 'CLÍNICA VETERINARIA'}
            </span>
            {profileForm.email && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="flex items-center gap-1.5 hover:text-brand-500 dark:hover:text-brand-400 transition-colors text-slate-600 dark:text-slate-400">
                  <Envelope size={16} className="text-slate-400 dark:text-slate-500" /> {profileForm.email}
                </span>
              </>
            )}
          </div>
          
          {ratingData.total > 0 && ratingData.average !== null && (
            <div className="flex items-center gap-2 mt-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <span className="font-bold text-amber-500">{ratingData.average.toFixed(1)}</span>
              <Stars rating={Math.round(ratingData.average)} size={16} />
              <span className="text-xs text-slate-400">({ratingData.total})</span>
            </div>
          )}

          {profileForm.location && (
            <span className="flex items-center gap-1.5 text-xs text-ink-light dark:text-slate-400 font-semibold mt-2.5">
              <MapPin size={14} className="text-brand-500" /> {profileForm.location}
            </span>
          )}
        </div>

        <div className="shrink-0 flex justify-center z-10 pt-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:text-brand-500 dark:hover:border-brand-500/50 dark:hover:text-brand-400 text-ink-medium dark:text-slate-300 font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] transform active:scale-95"
          >
            <PencilSimple size={16} weight="bold" className="text-brand-500" />
            {t('profile.common.editBtn') || 'Editar Perfil'}
          </button>
        </div>
      </div>

      {/* 2. Grid a 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* Columna Izquierda: Sobre nosotros + Impacto */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6 md:p-8">
            <h3 className="text-sm font-bold text-ink-dark dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Stethoscope size={20} className="text-brand-500" />
              {t('profile.common.aboutUs') || 'Sobre Nosotros'}
            </h3>
            {profileForm.description ? (
              <p className="text-ink-medium dark:text-slate-300 text-base leading-relaxed whitespace-pre-line font-medium border-l-4 border-brand-500/30 pl-4 py-1">
                {profileForm.description}
              </p>
            ) : (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-ink-light dark:text-slate-500 italic mb-3">
                  {t('profile.vet.noDescription') || 'Aún no has añadido una descripción sobre tu clínica.'}
                </p>
                <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-brand-500 hover:underline">
                  Añadir descripción
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6 md:p-8">
            <h3 className="text-sm font-bold text-ink-dark dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Heart size={20} className="text-brand-500" />
              {t('profile.common.impact') || 'Nuestro Impacto'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-center">
                <span className="block text-3xl font-black text-brand-500 mb-1">{stats.totalPets || 0}</span>
                <span className="text-xs font-bold text-ink-medium dark:text-slate-400 uppercase">{t('profile.common.petsAssisted') || 'Mascotas Atendidas'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-center">
                <span className="block text-3xl font-black text-blue-500 mb-1">{employees.length || 0}</span>
                <span className="text-xs font-bold text-ink-medium dark:text-slate-400 uppercase">{t('profile.common.employees') || 'Empleados'}</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Columna Derecha: Contacto + Enlaces */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6 md:p-8 h-fit">
            <h3 className="text-sm font-bold text-ink-dark dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Phone size={20} className="text-brand-500" />
              {t('profile.common.contactInfo') || 'Contacto'}
            </h3>
            <div className="space-y-4">
              {profileForm.location ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profileForm.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <MapPin size={22} className="text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-extrabold text-ink-light dark:text-slate-500 uppercase tracking-wider">{t('profile.common.location') || 'Ubicación'}</p>
                    <p className="text-sm font-semibold text-ink-medium dark:text-slate-300 group-hover:text-brand-500 transition-colors mt-0.5 leading-snug">{profileForm.location}</p>
                  </div>
                </a>
              ) : null}

              {profileForm.phone ? (
                <div className="flex items-start gap-4 p-3 rounded-2xl">
                  <Phone size={22} className="text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-extrabold text-ink-light dark:text-slate-500 uppercase tracking-wider">{t('profile.common.phone') || 'Teléfono'}</p>
                    <p className="text-sm font-semibold text-ink-medium dark:text-slate-300 mt-0.5">{profileForm.phone}</p>
                  </div>
                </div>
              ) : null}
              
              {(!profileForm.location && !profileForm.phone) && (
                <div className="text-center py-4 text-sm text-ink-light dark:text-slate-500 italic">
                  {t('profile.common.noContactInfo') || 'Aún no hay métodos de contacto.'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800/60 p-6 md:p-8">
            <h3 className="text-sm font-bold text-ink-dark dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
              <Globe size={20} className="text-brand-500" />
              {t('profile.common.socialLinks') || 'Enlaces y Redes'}
            </h3>
            {socialLinks.some(l => l.href) ? (
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.filter(l => l.href).map(link => (
                  <a
                    key={link.label}
                    href={link.href!}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-ink-medium dark:text-slate-300 font-bold transition-all hover:scale-[1.04] ${link.color}`}
                  >
                    <span className="shrink-0">{link.icon}</span>
                    <span className="text-[10px] uppercase tracking-wider">{t(`profile.common.${link.key}`) || link.label}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Globe size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-ink-light dark:text-slate-500 italic">
                  {t('profile.common.noSocialLinks') || 'Aún no has configurado enlaces de redes sociales o web oficial.'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Crop Modal — aparece encima de todo cuando el usuario selecciona una foto */}
      {cropImageSrc && onCropCancel && onCropConfirm && (
        <PhotoCropModal
          imageSrc={cropImageSrc}
          onCancel={onCropCancel}
          onConfirm={onCropConfirm}
        />
      )}
    </section>
    </>
  );
}

