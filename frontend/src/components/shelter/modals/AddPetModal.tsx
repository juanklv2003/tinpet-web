import { useEffect, useRef, useState } from 'react';
import { Image } from '@phosphor-icons/react';
import { StyledDatePicker } from '../../styled-date-picker';
import { StyledSelect } from '../../styled-select';
import { IconPlus, IconX } from '../Icons';
import { fileToDataUrl } from '../helpers';
import type { AddPetForm, PetStatus } from '../types';
import { emptyAddForm } from '../types';
import type { ShelterEmployee } from '../../../hooks/useShelterEmployees';
import { useTranslation } from '../../../i18n/useTranslation';

interface AddPetModalProps {
  onClose: () => void;
  onAdd: (form: AddPetForm) => Promise<void>;
  employees: ShelterEmployee[];
  showEmployeeField?: boolean;
}

export function AddPetModal({ onClose, onAdd, employees, showEmployeeField = false }: AddPetModalProps) {
  const t = useTranslation();
  const ANIMATION_MS = 280;
  const MAX_PHOTOS = 10;
  const [form, setForm] = useState<AddPetForm>(emptyAddForm);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const set = (field: keyof AddPetForm, val: string) =>
    setForm((p: AddPetForm) => ({ ...p, [field]: val }));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    if (form.photoFiles.length + selectedFiles.length > MAX_PHOTOS) {
      setErr(t('pets.modal.add.validationPhotoLimit', { count: MAX_PHOTOS }));
      return;
    }

    const invalidType = selectedFiles.some((file) => !file.type.startsWith('image/'));
    if (invalidType) {
      setErr(t('pets.modal.add.validationImageOnly'));
      return;
    }

    const oversized = selectedFiles.find((file) => file.size > 4 * 1024 * 1024);
    if (oversized) {
      setErr(t('pets.modal.add.validationImageSize', { name: oversized.name }));
      return;
    }

    try {
      const urls = await Promise.all(selectedFiles.map((file) => fileToDataUrl(file)));
      setForm((prev: AddPetForm) => ({
        ...prev,
        photoFiles: [...prev.photoFiles, ...selectedFiles],
        photoUrls: [...prev.photoUrls, ...urls],
      }));
      setErr(null);
    } catch (error: unknown) {
      setErr((error as Error).message ?? t('pets.modal.add.validationImageLoadError'));
    } finally {
      e.target.value = '';
    }
  };

  const removePhotoAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== index),
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.species.trim() || !form.breed.trim()) {
      setErr(t('pets.modal.add.validationRequired'));
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (form.birthDate) {
      const bDate = new Date(form.birthDate);
      if (bDate > today) {
        setErr('La fecha de nacimiento no puede ser posterior a hoy.');
        return;
      }
    }

    if (form.intakeDate) {
      const iDate = new Date(form.intakeDate);
      if (iDate > today) {
        setErr('La fecha de recogida no puede ser posterior a hoy.');
        return;
      }
    }
    setSubmitting(true);
    setErr(null);
    try {
      await onAdd(form);
      handleClose();
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar panel"
        onClick={handleClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`absolute right-3 top-3 max-h-[calc(100vh-1.5rem)] flex flex-col w-[calc(100%-1.5rem)] sm:w-[26rem] xl:w-[28rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-gray-900 dark:text-white font-semibold text-lg">{t('pets.modal.add.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <IconX />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 xl:p-7 overflow-y-auto flex flex-col gap-4 min-h-0"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.name')} *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder={t('pets.modal.add.namePlaceholder')}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.species')} *
              </label>
              <input
                type="text"
                value={form.species}
                onChange={e => set('species', e.target.value)}
                placeholder={t('pets.modal.add.speciesPlaceholder')}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.breed')} *
              </label>
              <input
                type="text"
                value={form.breed}
                onChange={e => set('breed', e.target.value)}
                placeholder={t('pets.modal.add.breedPlaceholder')}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.size')}
              </label>
              <StyledSelect
                value={form.size}
                onChange={(value) => set('size', value as string)}
                options={[
                  { value: '', label: '---' },
                  { value: 'large', label: t('pets.sizes.large') },
                  { value: 'medium', label: t('pets.sizes.medium') },
                  { value: 'small', label: t('pets.sizes.small') },
                ]}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.status')}
              </label>
              <StyledSelect
                value={form.status}
                onChange={(value) => set('status', value as PetStatus)}
                options={[
                  { value: 'available', label: t('pets.status.available') },
                  { value: 'pending', label: t('pets.status.pending') },
                  { value: 'adopted', label: t('pets.status.adopted') },
                ]}
              />
            </div>
            {showEmployeeField && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {t('pets.modal.add.inChargeEmployee')}
                </label>
                <StyledSelect
                  value={form.inChargeEmployeeId}
                  onChange={(value) => set('inChargeEmployeeId', value as string)}
                  options={[
                    { value: '', label: t('pets.modal.add.none') },
                    ...employees.map(emp => ({
                      value: emp.id,
                      label: emp.name + (emp.role ? ` (${emp.role})` : ''),
                    })),
                  ]}
                />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.description')}
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder={t('pets.modal.add.descriptionPlaceholder')}
                rows={3}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition resize-none"
              />
            </div>
            <div className="col-span-2 flex flex-col min-h-[17rem]">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.photoLabel')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              {form.photoUrls[0] ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-3"
                >
                  <div className="w-full h-full min-h-[12rem] xl:min-h-[15rem] mx-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    <img
                      src={form.photoUrls[0]}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/70 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-3"
                >
                  <div className="w-full h-full min-h-[12rem] xl:min-h-[15rem] mx-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                    <div className="flex flex-col items-center text-center px-4">
                      <Image size={40} className="mb-3 text-brand" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {t('pets.modal.add.photoUploadClick')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {t('pets.modal.add.photoUploadLimit', { count: MAX_PHOTOS })}
                      </p>
                    </div>
                  </div>
                </button>
              )}
              {form.photoFiles.length > 0 && (
                <>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-500">
                      {form.photoFiles.length === 1 
                        ? t('pets.modal.add.photoCount_one', { count: 1 }) 
                        : t('pets.modal.add.photoCount_other', { count: form.photoFiles.length })} / {MAX_PHOTOS}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={form.photoUrls.length >= MAX_PHOTOS}
                      className="h-7 w-7 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label={t('pets.modal.add.photoAddAnother')}
                      title={form.photoUrls.length >= MAX_PHOTOS ? t('pets.modal.add.photoLimitReached', { count: MAX_PHOTOS }) : t('pets.modal.add.photoAddAnother')}
                    >
                      <IconPlus />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {form.photoUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative group">
                        <img src={url} alt={`Foto ${index + 1}`} className="h-14 w-full rounded-md object-cover border border-gray-200 dark:border-gray-700" />
                        <button
                          type="button"
                          onClick={() => removePhotoAt(index)}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black/80 text-white text-xs hidden group-hover:flex items-center justify-center"
                          aria-label={t('pets.modal.add.photoDelete')}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.birthDateLabel')}
              </label>
              <StyledDatePicker
                value={form.birthDate}
                onChange={(date) => set('birthDate', date)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t('pets.modal.add.intakeDateLabel')}
              </label>
              <StyledDatePicker
                value={form.intakeDate}
                onChange={(date) => set('intakeDate', date)}
              />
            </div>
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <IconPlus />
              {submitting ? t('pets.modal.add.adding') : t('pets.modal.add.addPet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
