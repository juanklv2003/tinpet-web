import { useRef } from 'react';
import { Facebook, House, Instagram, MapPin, Youtube } from 'lucide-react';
import type { ShelterProfileForm } from '../types';

interface ProfileViewProps {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  profileForm: ShelterProfileForm;
  profileDirty: boolean;
  profileSaveMsg: string | null;
  profileError: string | null;
  onUpdateField: (field: keyof ShelterProfileForm, value: string) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

export function ProfileView({
  user,
  profileForm,
  profileDirty,
  profileSaveMsg,
  profileError,
  onUpdateField,
  onPhotoSelect,
  onSave,
}: ProfileViewProps) {
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
      <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-5">
          Vista previa
        </h2>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 lg:p-5">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-16 lg:w-20 h-16 lg:h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
              {profileForm.avatarUrl ? (
                <img
                  src={profileForm.avatarUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <House className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {profileForm.displayName || 'Tu refugio'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {profileForm.email || 'Sin email'}
              </p>
              <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase">
                {user?.role || '—'}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">Ubicacion:</span>{' '}
              {profileForm.location || 'No especificada'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">Telefono:</span>{' '}
              {profileForm.phone || 'No especificado'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">Web:</span>{' '}
              {profileForm.website || 'No especificada'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">Descripcion:</span>{' '}
              {profileForm.description || 'Sin descripcion'}
            </p>
          </div>

          {/* Social Media & Maps */}
          <div className="mt-4 flex flex-wrap gap-2">
            {profileForm.location && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profileForm.location)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors shadow-sm">
                <MapPin className="w-4 h-4" /> Google Maps
              </a>
            )}
            {profileForm.instagram && (
              <a href={profileForm.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-pink-600 transition-colors shadow-sm">
                <Instagram className="w-4 h-4" /> Instagram
              </a>
            )}
            {profileForm.facebook && (
              <a href={profileForm.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors shadow-sm">
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            )}
            {profileForm.youtube && (
              <a href={profileForm.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 transition-colors shadow-sm">
                <Youtube className="w-4 h-4" /> YouTube
              </a>
            )}
            {profileForm.tiktok && (
              <a href={profileForm.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg> TikTok
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="xl:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-5">
          Editar perfil
        </h2>

        <input
          ref={profilePhotoInputRef}
          type="file"
          accept="image/*"
          onChange={onPhotoSelect}
          className="hidden"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => profilePhotoInputRef.current?.click()}
              className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors p-3"
            >
              <div className="h-28 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                {profileForm.avatarUrl ? (
                  <img
                    src={profileForm.avatarUrl}
                    alt="Vista previa perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    Haz click para subir foto de perfil
                  </p>
                )}
              </div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Nombre del refugio
            </label>
            <input
              type="text"
              value={profileForm.displayName}
              onChange={e => onUpdateField('displayName', e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profileForm.email}
              onChange={e => onUpdateField('email', e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Ubicacion
            </label>
            <input
              type="text"
              value={profileForm.location}
              onChange={e => onUpdateField('location', e.target.value)}
              placeholder="Ciudad, provincia"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Telefono
            </label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={e => onUpdateField('phone', e.target.value)}
              placeholder="+34 ..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Sitio Web
            </label>
            <input
              type="text"
              value={profileForm.website}
              onChange={e => onUpdateField('website', e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>



          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Instagram
            </label>
            <input
              type="text"
              value={profileForm.instagram}
              onChange={e => onUpdateField('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              TikTok
            </label>
            <input
              type="text"
              value={profileForm.tiktok}
              onChange={e => onUpdateField('tiktok', e.target.value)}
              placeholder="https://tiktok.com/@..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Facebook
            </label>
            <input
              type="text"
              value={profileForm.facebook}
              onChange={e => onUpdateField('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              YouTube
            </label>
            <input
              type="text"
              value={profileForm.youtube}
              onChange={e => onUpdateField('youtube', e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Descripcion
            </label>
            <textarea
              rows={4}
              value={profileForm.description}
              onChange={e => onUpdateField('description', e.target.value)}
              placeholder="Cuenta brevemente la mision del refugio"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-gray-400 resize-y"
            />
          </div>
        </div>

        {profileError && (
          <p className="mt-4 text-sm text-red-500">{profileError}</p>
        )}
        {profileSaveMsg && (
          <p className="mt-4 text-sm text-emerald-500">{profileSaveMsg}</p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={!profileDirty}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
