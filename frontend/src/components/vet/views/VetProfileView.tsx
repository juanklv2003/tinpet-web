import { useRef, useState, useEffect } from 'react';
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
  Image,
  ArrowLeft,
  Envelope,
  FloppyDisk,
} from '@phosphor-icons/react';
import type { VetProfileForm } from '../types';
import { PhotoCropModal } from './PhotoCropModal';
import { useTranslation } from '../../../i18n/useTranslation';

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

  // Volver a la vista previa tras guardar exitosamente
  useEffect(() => {
    if (profileSaveMsg && !profileError) {
      const timer = setTimeout(() => {
        setIsEditing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [profileSaveMsg, profileError]);

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-2xl px-4 py-3.5 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-wider mb-2";

  const socialLinks = [
    { key: 'location' as keyof VetProfileForm, icon: <MapPin size={18} className="text-brand-500" />, label: 'Ubicación', value: profileForm.location, href: profileForm.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profileForm.location)}` : null },
    { key: 'instagram' as keyof VetProfileForm, icon: <InstagramLogo size={20} />, label: 'Instagram', value: profileForm.instagram, href: profileForm.instagram || null, color: 'hover:text-pink-600 hover:border-pink-500/30' },
    { key: 'facebook' as keyof VetProfileForm, icon: <FacebookLogo size={20} />, label: 'Facebook', value: profileForm.facebook, href: profileForm.facebook || null, color: 'hover:text-blue-600 hover:border-blue-500/30' },
    { key: 'youtube' as keyof VetProfileForm, icon: <YoutubeLogo size={20} />, label: 'YouTube', value: profileForm.youtube, href: profileForm.youtube || null, color: 'hover:text-red-600 hover:border-red-500/30' },
    { key: 'tiktok' as keyof VetProfileForm, icon: <TiktokLogo size={20} />, label: 'TikTok', value: profileForm.tiktok, href: profileForm.tiktok || null, color: 'hover:text-black hover:border-black/30 dark:hover:text-white dark:hover:border-white/30' },
    { key: 'website' as keyof VetProfileForm, icon: <Globe size={20} />, label: 'Sitio Web', value: profileForm.website, href: profileForm.website || null, color: 'hover:text-brand-500 hover:border-brand-500/30' },
  ];

  if (isEditing) {
    return (
      <section className="animate-bento-in max-w-4xl mx-auto pb-16">
        {/* Header de Edición */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-2 text-ink-light dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors text-sm font-semibold mb-2 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Volver al perfil
            </button>
            <h2 className="font-serif text-3xl text-ink-dark dark:text-white">
              Editar Perfil de la Clínica
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-3 rounded-xl text-sm font-bold border border-ink-light/20 dark:border-slate-700 text-ink-medium dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!profileDirty}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-md shadow-brand-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
            >
              <FloppyDisk size={18} weight="bold" />
              {t('profile.modal.saveChanges')}
            </button>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-surface dark:bg-slate-800/90 rounded-3xl shadow-xl border border-white dark:border-slate-700/80 p-8 transition-colors">
          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoSelect}
            className="hidden"
          />

          {/* Subir foto de perfil */}
          <div className="mb-8">
            <label className={labelClass}>{t('profile.modal.basicData')}</label>
            <div className="flex flex-col md:flex-row items-center gap-6 mt-3">
              <div className="relative group shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-100 dark:border-brand-900/30 bg-background dark:bg-slate-900 shadow-inner flex items-center justify-center">
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope size={48} className="text-slate-400 dark:text-slate-600" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                >
                  Cambiar Foto
                </button>
              </div>

              <div className="flex-1 w-full">
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-ink-light/20 dark:border-slate-600 bg-background dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/20 dark:hover:bg-brand-500/5 transition-all p-6 flex flex-col items-center justify-center gap-2 text-ink-medium dark:text-slate-400"
                >
                  <Image size={28} className="text-brand-500" />
                  <span className="text-sm font-semibold">Subir una nueva foto de perfil</span>
                  <span className="text-xs text-ink-light dark:text-slate-500">Formatos recomendados: JPG, PNG o WEBP</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Nombre de la Clínica Veterinaria</label>
              <input
                type="text"
                value={profileForm.displayName}
                onChange={e => onUpdateField('displayName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('profile.modal.email')}</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => onUpdateField('email', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('profile.modal.location')}</label>
              <input
                type="text"
                value={profileForm.location}
                onChange={e => onUpdateField('location', e.target.value)}
                placeholder="Ej. Barcelona, España"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono de Contacto</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={e => onUpdateField('phone', e.target.value)}
                placeholder="+34 ..."
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Sitio Web Oficial</label>
              <input
                type="text"
                value={profileForm.website}
                onChange={e => onUpdateField('website', e.target.value)}
                placeholder="https://miclinicavet.com"
                className={inputClass}
              />
            </div>

            {/* Redes Sociales */}
            <div className="md:col-span-2 mt-6">
              <p className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-ink-light/10 dark:border-slate-700">
                {t('profile.modal.socialNetworks')}
              </p>
            </div>

            <div>
              <label className={labelClass}>Instagram (URL completa)</label>
              <input
                type="text"
                value={profileForm.instagram}
                onChange={e => onUpdateField('instagram', e.target.value)}
                placeholder="https://instagram.com/mi_clinica"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>TikTok (URL completa)</label>
              <input
                type="text"
                value={profileForm.tiktok}
                onChange={e => onUpdateField('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@mi_clinica"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Facebook (URL completa)</label>
              <input
                type="text"
                value={profileForm.facebook}
                onChange={e => onUpdateField('facebook', e.target.value)}
                placeholder="https://facebook.com/mi_clinica"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>YouTube (URL completa)</label>
              <input
                type="text"
                value={profileForm.youtube}
                onChange={e => onUpdateField('youtube', e.target.value)}
                placeholder="https://youtube.com/c/mi_clinica"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>{t('profile.modal.description')}</label>
              <textarea
                rows={5}
                value={profileForm.description}
                onChange={e => onUpdateField('description', e.target.value)}
                placeholder="Describe la clínica, servicios, especialidades y equipo médico..."
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {profileError && (
            <div className="mt-6 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-200 dark:border-red-800/30">
              {profileError}
            </div>
          )}
          {profileSaveMsg && (
            <div className="mt-6 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-4 rounded-2xl border border-green-200 dark:border-green-800/30 animate-pulse">
              {profileSaveMsg}
            </div>
          )}

          {/* Botones inferiores */}
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-xl text-sm font-bold border border-ink-light/20 dark:border-slate-700 text-ink-medium dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={!profileDirty}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-pink-600 hover:from-brand-600 hover:to-pink-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-md shadow-brand-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-95"
            >
              <FloppyDisk size={18} weight="bold" />
              {t('profile.modal.saveChanges')}
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

  // Vista Previa a Pantalla Completa
  return (
    <section className="animate-bento-in max-w-5xl mx-auto pb-12">
      {/* Banner / Cover */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-bento border border-slate-100 dark:border-slate-700/80 transition-all">
        {/* Cover Gradient */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-brand-500/20 via-brand-500/5 to-pink-500/10 dark:from-brand-500/10 dark:to-slate-800 relative">
          {profileForm.avatarUrl && (
            <img
              src={profileForm.avatarUrl}
              alt=""
              className="w-full h-full object-cover opacity-10 blur-md scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-slate-800" />
        </div>

        {/* Info Cabecera y Avatar */}
        <div className="px-6 md:px-10 pb-8 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Avatar e Identidad */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 md:-mt-24">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-4 border-white dark:border-slate-800 bg-background dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-xl shrink-0 z-10">
              {profileForm.avatarUrl ? (
                <img src={profileForm.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <Stethoscope size={64} className="text-ink-light dark:text-slate-500" />
              )}
            </div>

            <div className="text-center md:text-left z-10 pb-2">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <h2 className="font-serif text-3xl md:text-4xl text-ink-dark dark:text-white leading-tight">
                  {profileForm.displayName || 'Tu clínica'}
                </h2>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-brand-500 text-white uppercase tracking-wider shadow-sm">
                  {t('profile.officialBadge')}
                </span>
              </div>
              <p className="text-sm font-medium text-ink-medium dark:text-slate-400 mt-2 flex items-center justify-center md:justify-start gap-1.5">
                <Envelope size={16} className="text-brand-500" />
                {profileForm.email || 'Sin email configurado'}
              </p>
            </div>
          </div>

          {/* Botón de Editar */}
          <div className="shrink-0 flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400 text-ink-medium dark:text-slate-300 font-bold px-6 py-3 rounded-2xl text-sm shadow-md transition-all hover:scale-[1.02] transform active:scale-95"
            >
              <PencilSimple size={16} weight="bold" className="text-brand-500" />
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Columna Principal - Historia */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-bento border border-slate-100 dark:border-slate-700/80 p-8 transition-all">
            <h3 className="text-lg font-bold text-ink-dark dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-3 mb-5">
              Sobre Nosotros
            </h3>
            {profileForm.description ? (
              <p className="text-ink-medium dark:text-slate-300 text-base leading-relaxed whitespace-pre-line font-medium">
                {profileForm.description}
              </p>
            ) : (
              <div className="py-10 text-center">
                <Stethoscope size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-ink-light dark:text-slate-500 italic text-sm">
                  Aún no has añadido una descripción sobre tu clínica. ¡Haz clic en "Editar Perfil" para contar tu historia, servicios y especialidades!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Lateral - Información & Redes */}
        <div className="space-y-8">
          {/* Tarjeta de Contacto */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-bento border border-slate-100 dark:border-slate-700/80 p-8 transition-all">
            <h3 className="text-lg font-bold text-ink-dark dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-3 mb-5">
              Información de Contacto
            </h3>
            <div className="space-y-4">
              {profileForm.location ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profileForm.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors group"
                >
                  <MapPin size={22} className="text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-wider">Ubicación</p>
                    <p className="text-sm font-semibold text-ink-medium dark:text-slate-300 group-hover:text-brand-500 transition-colors mt-0.5">{profileForm.location}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-start gap-3 p-3">
                  <MapPin size={22} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-wider">Ubicación</p>
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic mt-0.5">No especificada</p>
                  </div>
                </div>
              )}

              {profileForm.phone ? (
                <div className="flex items-start gap-3 p-3 rounded-2xl">
                  <Phone size={22} className="text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-wider">Teléfono</p>
                    <p className="text-sm font-semibold text-ink-medium dark:text-slate-300 mt-0.5">{profileForm.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3">
                  <Phone size={22} className="text-slate-300 dark:text-slate-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-wider">Teléfono</p>
                    <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic mt-0.5">No especificado</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Redes Sociales */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-bento border border-slate-100 dark:border-slate-700/80 p-8 transition-all">
            <h3 className="text-lg font-bold text-ink-dark dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-3 mb-5">
              Enlaces y Redes
            </h3>
            {socialLinks.some(l => l.href) ? (
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.filter(l => l.href).map(link => (
                  <a
                    key={link.label}
                    href={link.href!}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 text-ink-medium dark:text-slate-300 font-bold transition-all hover:scale-[1.04] ${link.color}`}
                  >
                    <span className="shrink-0">{link.icon}</span>
                    <span className="text-[11px] uppercase tracking-wider">{link.label}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Globe size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs text-ink-light dark:text-slate-500 italic">
                  Aún no has configurado enlaces de redes sociales o web oficial.
                </p>
              </div>
            )}
          </div>
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
