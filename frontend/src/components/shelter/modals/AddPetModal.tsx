import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { StyledDatePicker } from '../../styled-date-picker';
import { StyledSelect } from '../../styled-select';
import { IconPlus, IconX } from '../Icons';
import { fileToDataUrl } from '../helpers';
import type { AddPetForm, PetStatus } from '../types';
import { emptyAddForm } from '../types';
import type { ShelterEmployee } from '../../../hooks/useShelterEmployees';

interface AddPetModalProps {
  onClose: () => void;
  onAdd: (form: AddPetForm) => Promise<void>;
  employees: ShelterEmployee[];
}

export function AddPetModal({ onClose, onAdd, employees }: AddPetModalProps) {
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
      setErr(`Solo puedes subir hasta ${MAX_PHOTOS} fotos por mascota.`);
      return;
    }

    const invalidType = selectedFiles.some((file) => !file.type.startsWith('image/'));
    if (invalidType) {
      setErr('Todos los archivos deben ser imágenes.');
      return;
    }

    const oversized = selectedFiles.find((file) => file.size > 4 * 1024 * 1024);
    if (oversized) {
      setErr(`La imagen ${oversized.name} supera 4MB.`);
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
      setErr((error as Error).message ?? 'No se pudo cargar la imagen');
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
    if (!form.name.trim() || !form.species.trim()) {
      setErr('Nombre y especie son obligatorios.');
      return;
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
        className={`absolute right-3 top-3 bottom-3 w-[calc(100%-1.5rem)] sm:w-[30rem] xl:w-[35rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Nueva mascota</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <IconX />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 xl:p-7 h-[calc(100%-73px)] overflow-y-auto flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Ej: Max"
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Especie *
              </label>
              <input
                type="text"
                value={form.species}
                onChange={e => set('species', e.target.value)}
                placeholder="Ej: Perro"
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Raza
              </label>
              <input
                type="text"
                value={form.breed}
                onChange={e => set('breed', e.target.value)}
                placeholder="Ej: Labrador"
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Estado
              </label>
              <StyledSelect
                value={form.status}
                onChange={(value) => set('status', value as PetStatus)}
                options={[
                  { value: 'available', label: 'Disponible' },
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'adopted', label: 'Adoptado' },
                ]}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Empleado encargado (Opcional)
              </label>
              <StyledSelect
                value={form.inChargeEmployeeId}
                onChange={(value) => set('inChargeEmployeeId', value as string)}
                options={[
                  { value: '', label: 'Ninguno' },
                  ...employees.map(emp => ({
                    value: emp.id,
                    label: emp.name + (emp.role ? ` (${emp.role})` : ''),
                  })),
                ]}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Cuenta algo sobre la mascota..."
                rows={3}
                className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition resize-none"
              />
            </div>
            <div className="col-span-2 flex flex-col min-h-[17rem]">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Foto
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
                      <ImagePlus className="w-10 h-10 mb-3 text-brand" strokeWidth={1.5} />
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Haz click para subir fotos
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        PNG, JPG o WEBP (max {MAX_PHOTOS})
                      </p>
                    </div>
                  </div>
                </button>
              )}
              {form.photoFiles.length > 0 && (
                <>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-500">
                      {form.photoFiles.length} / {MAX_PHOTOS} foto{form.photoFiles.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={form.photoUrls.length >= MAX_PHOTOS}
                      className="h-7 w-7 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      aria-label="Añadir otra foto"
                      title={form.photoUrls.length >= MAX_PHOTOS ? `Límite de ${MAX_PHOTOS} fotos` : 'Añadir otra foto'}
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
                          aria-label="Eliminar foto"
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
                Fecha de nacimiento
              </label>
              <StyledDatePicker
                value={form.birthDate}
                onChange={(date) => set('birthDate', date)}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Fecha de recogida
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <IconPlus />
              {submitting ? 'Añadiendo...' : 'Añadir mascota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
