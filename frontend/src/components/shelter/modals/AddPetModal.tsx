import { useState, useRef } from 'react';
import { IconPlus, IconX } from '../Icons';
import { fileToDataUrl } from '../helpers';
import type { AddPetForm, PetStatus } from '../types';
import { emptyAddForm } from '../types';

interface AddPetModalProps {
  onClose: () => void;
  onAdd: (form: AddPetForm) => Promise<void>;
}

export function AddPetModal({ onClose, onAdd }: AddPetModalProps) {
  const [form, setForm] = useState<AddPetForm>(emptyAddForm);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const set = (field: keyof AddPetForm, val: string) =>
    setForm((p: AddPetForm) => ({ ...p, [field]: val }));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErr('El archivo debe ser una imagen.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErr('La imagen es demasiado grande. Usa una de menos de 4MB.');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev: AddPetForm) => ({ ...prev, photoFile: file, photoUrl: dataUrl }));
      setErr(null);
    } catch (error: unknown) {
      setErr((error as Error).message ?? 'No se pudo cargar la imagen');
    }
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
      onClose();
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">Nueva mascota</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
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
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
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
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
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
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Estado
              </label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as PetStatus)}
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              >
                <option value="available">Disponible</option>
                <option value="pending">Pendiente</option>
                <option value="adopted">Adoptado</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Foto
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-gray-600 bg-gray-800/70 hover:bg-gray-800 transition-colors p-3"
              >
                <div className="aspect-square w-full max-h-52 mx-auto rounded-lg border border-gray-700 bg-gray-900 flex items-center justify-center overflow-hidden">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center px-4">
                      <p className="text-3xl mb-2">🖼️</p>
                      <p className="text-sm text-gray-300 font-medium">
                        Haz click para subir una foto
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG o WEBP
                      </p>
                    </div>
                  )}
                </div>
              </button>
              {form.photoFile && (
                <p className="text-xs text-gray-500 mt-1.5 truncate">
                  Archivo: {form.photoFile.name}
                </p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={e => set('birthDate', e.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Fecha de recogida
              </label>
              <input
                type="date"
                value={form.intakeDate}
                onChange={e => set('intakeDate', e.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-gray-600 text-white px-3 py-2 text-sm outline-none focus:border-gray-400 transition"
              />
            </div>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-600 text-gray-300 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-white text-gray-900 py-2 text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
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
