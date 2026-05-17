import { useRef } from 'react';
import {
  MapPin,
  InstagramLogo,
  FacebookLogo,
  YoutubeLogo,
  TiktokLogo,
  Globe,
  Phone,
  Stethoscope,
  PencilSimple,
  Image,
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
  user,
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
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);

  const inputClass = "w-full bg-white dark:bg-slate-900 border border-ink-light/20 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-medium text-ink-dark dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-ink-light dark:text-slate-400 uppercase tracking-wider mb-2";

  const socialLinks = [
    { key: 'location' as keyof VetProfileForm, icon: <MapPin size={16} />, label: 'Ubicación', href: profileForm.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profileForm.location)}` : null },
    { key: 'instagram' as keyof VetProfileForm, icon: <InstagramLogo size={16} />, label: 'Instagram', href: profileForm.instagram || null },
    { key: 'facebook' as keyof VetProfileForm, icon: <FacebookLogo size={16} />, label: 'Facebook', href: profileForm.facebook || null },
    { key: 'youtube' as keyof VetProfileForm, icon: <YoutubeLogo size={16} />, label: 'YouTube', href: profileForm.youtube || null },
    { key: 'tiktok' as keyof VetProfileForm, icon: <TiktokLogo size={16} />, label: 'TikTok', href: profileForm.tiktok || null },
    { key: 'website' as keyof VetProfileForm, icon: <Globe size={16} />, label: 'Web', href: profileForm.website || null },
  ];

  return (
    <section className="animate-bento-in max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif text-4xl md:text-5xl text-ink-dark dark:text-white leading-tight">
          {t('profile.title')}
        </h2>
        <p className="text-ink-medium dark:text-slate-400 mt-3 font-medium text-sm">
          {t('profile.subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Preview card */}
        <div className="xl:col-span-2 bento-item">
          <div className="bg-surface dark:bg-slate-800 rounded-3xl shadow-bento border border-white dark:border-slate-700 overflow-hidden sticky top-10 transition-colors">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/30 dark:to-slate-800 relative">
              {profileForm.avatarUrl && (
                <img src={profileForm.avatarUrl} alt="" className="w-full h-full object-cover opacity-30" />
              )}
            </div>

            {/* Avatar */}
            <div className="px-8 pb-8">
              <div className="-mt-12 mb-5">
                <div className="w-24 h-24 rounded-full border-4 border-surface dark:border-slate-800 bg-background dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-sm">
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope size={36} weight="fill" className="text-ink-light dark:text-slate-500" />
                  )}
                </div>
              </div>

              <h3 className="font-serif text-xl text-ink-dark dark:text-white">
                {profileForm.displayName || 'Tu clínica'}
              </h3>
              <p className="text-sm text-ink-medium dark:text-slate-400 mt-1">
                {profileForm.email || 'Sin email'}
              </p>

              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-500/10 text-brand-500 uppercase tracking-wider">
                {t('profile.officialBadge')}
              </span>

              <div className="mt-6 space-y-3 text-sm">
                {profileForm.location && (
                  <div className="flex items-center gap-2 text-ink-medium dark:text-slate-300">
                    <MapPin size={16} className="text-ink-light shrink-0" />
                    <span>{profileForm.location}</span>
                  </div>
                )}
                {profileForm.phone && (
                  <div className="flex items-center gap-2 text-ink-medium dark:text-slate-300">
                    <Phone size={16} className="text-ink-light shrink-0" />
                    <span>{profileForm.phone}</span>
                  </div>
                )}
                {profileForm.description && (
                  <p className="text-ink-medium dark:text-slate-400 italic text-sm mt-4 leading-relaxed">
                    "{profileForm.description}"
                  </p>
                )}
              </div>

              {/* Social links */}
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.filter(l => l.href).map(link => (
                  <a
                    key={link.label}
                    href={link.href!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-background dark:bg-slate-900 border border-ink-light/15 dark:border-slate-700 text-ink-medium dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 transition-all"
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="xl:col-span-3 bento-item" style={{ animationDelay: '100ms' }}>
          <div className="bg-surface dark:bg-slate-800 rounded-3xl shadow-bento border border-white dark:border-slate-700 p-8 transition-colors">
            <h3 className="font-serif text-xl text-ink-dark dark:text-white mb-8">
              {t('profile.modal.title')}
            </h3>

            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoSelect}
              className="hidden"
            />

            {/* Photo upload */}
            <div className="mb-6">
              <label className={labelClass}>{t('profile.modal.basicData')}</label>
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-ink-light/20 dark:border-slate-600 bg-background dark:bg-slate-900 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 transition-all p-5 flex flex-col items-center justify-center gap-2 text-ink-medium dark:text-slate-400 group"
              >
                {profileForm.avatarUrl ? (
                  <div className="h-28 w-full rounded-xl overflow-hidden">
                    <img src={profileForm.avatarUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <>
                    <Image size={32} className="text-ink-light group-hover:text-brand-500 transition-colors" />
                    <span className="text-sm font-medium">Haz clic para subir foto de perfil</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>{t('profile.modal.clinicName')}</label>
                <input type="text" value={profileForm.displayName} onChange={e => onUpdateField('displayName', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('profile.modal.email')}</label>
                <input type="email" value={profileForm.email} onChange={e => onUpdateField('email', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('profile.modal.location')}</label>
                <input type="text" value={profileForm.location} onChange={e => onUpdateField('location', e.target.value)} placeholder="Ciudad, provincia" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input type="text" value={profileForm.phone} onChange={e => onUpdateField('phone', e.target.value)} placeholder="+34 ..." className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Sitio Web</label>
                <input type="text" value={profileForm.website} onChange={e => onUpdateField('website', e.target.value)} placeholder="https://..." className={inputClass} />
              </div>

              {/* Socials separator */}
              <div className="md:col-span-2 mt-4">
                <p className="text-xs font-bold text-ink-light dark:text-slate-500 uppercase tracking-widest mb-5 pb-3 border-b border-ink-light/10 dark:border-slate-700">
                  {t('profile.modal.socialNetworks')}
                </p>
              </div>

              <div>
                <label className={labelClass}>Instagram</label>
                <input type="text" value={profileForm.instagram} onChange={e => onUpdateField('instagram', e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>TikTok</label>
                <input type="text" value={profileForm.tiktok} onChange={e => onUpdateField('tiktok', e.target.value)} placeholder="https://tiktok.com/@..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Facebook</label>
                <input type="text" value={profileForm.facebook} onChange={e => onUpdateField('facebook', e.target.value)} placeholder="https://facebook.com/..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>YouTube</label>
                <input type="text" value={profileForm.youtube} onChange={e => onUpdateField('youtube', e.target.value)} placeholder="https://youtube.com/..." className={inputClass} />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>{t('profile.modal.description')}</label>
                <textarea
                  rows={4}
                  value={profileForm.description}
                  onChange={e => onUpdateField('description', e.target.value)}
                  placeholder="Describe los servicios de tu clínica veterinaria..."
                  className={`${inputClass} resize-y`}
                />
              </div>
            </div>

            {profileError && (
              <p className="mt-5 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{profileError}</p>
            )}
            {profileSaveMsg && (
              <p className="mt-5 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">{profileSaveMsg}</p>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={onSave}
                disabled={!profileDirty}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-sm shadow-brand-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PencilSimple size={16} weight="bold" />
                {t('profile.modal.saveChanges')}
              </button>
            </div>
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
