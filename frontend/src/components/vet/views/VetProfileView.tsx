import { useRef } from 'react';
import { Stethoscope } from 'lucide-react';
import type { VetProfileForm } from '../types';

interface VetProfileViewProps {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  profileForm: VetProfileForm;
  profileDirty: boolean;
  profileSaveMsg: string | null;
  profileError: string | null;
  onUpdateField: (field: keyof VetProfileForm, value: string) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  onSave,
}: VetProfileViewProps) {
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
                <Stethoscope className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {profileForm.displayName || 'Tu veterinaria'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {profileForm.email || 'Sin email'}
              </p>
              <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand/10 text-brand uppercase">
                {user?.role || '—'}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">Ubicación:</span>{' '}
              {profileForm.location || 'No especificada'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">Teléfono:</span>{' '}
              {profileForm.phone || 'No especificado'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="text-gray-400">Descripción:</span>{' '}
              {profileForm.description || 'Sin descripción'}
            </p>
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
                    Haz clic para subir foto de perfil
                  </p>
                )}
              </div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Nombre de la clínica
            </label>
            <input
              type="text"
              value={profileForm.displayName}
              onChange={e => onUpdateField('displayName', e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand"
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
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={profileForm.location}
              onChange={e => onUpdateField('location', e.target.value)}
              placeholder="Ciudad, provincia"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={e => onUpdateField('phone', e.target.value)}
              placeholder="+34 ..."
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Descripción
            </label>
            <textarea
              rows={4}
              value={profileForm.description}
              onChange={e => onUpdateField('description', e.target.value)}
              placeholder="Describe los servicios de tu clínica veterinaria"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand resize-y"
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
            className="px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-semibold shadow-sm shadow-brand/20 transition-[background-color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
