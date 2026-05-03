import { useEffect, useRef, useState } from 'react';
import type { ShelterEmployee } from '../../../hooks/useShelterEmployees';
import { apiFetch } from '../../../services/api';
import type { Pet } from '../../../types';
import { StyledDatePicker } from '../../styled-date-picker';
import { StyledSelect } from '../../styled-select';
import { IconTrash, IconX } from '../Icons';
import { NA } from '../components/NA';
import { Row } from '../components/Row';
import { fileToDataUrl, fmtDate } from '../helpers';
import type { EditPetForm, PetStatus } from '../types';

interface PetProfileModalProps {
  pet: Pet;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: Pet) => void;
  employees: ShelterEmployee[];
}

const MAX_PHOTOS = 10;

const readPhotoUrls = (aiProfile: Record<string, unknown> | undefined): string[] => {
  const fromList = aiProfile?.photoUrls;
  if (Array.isArray(fromList)) {
    return fromList.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, MAX_PHOTOS);
  }

  if (typeof aiProfile?.photoUrl === 'string' && aiProfile.photoUrl.trim()) {
    return [aiProfile.photoUrl];
  }

  return [];
};

export function PetProfileModal({
  pet,
  onClose,
  onDelete,
  onUpdate,
  employees,
}: PetProfileModalProps) {
  const ANIMATION_MS = 280;
  const [ai, setAi] = useState<Record<string, unknown>>(pet.ai_profile ?? {});
  const [form, setForm] = useState<EditPetForm>({
    name: pet.name,
    species: pet.species,
    status: pet.status,
    breed: pet.ai_profile?.breed ?? '',
    birthDate: pet.ai_profile?.birthDate ?? '',
    photoUrls: readPhotoUrls(pet.ai_profile),
    inChargeEmployeeId: pet.ai_profile?.inChargeEmployeeId ?? '',
    description: pet.description ?? '',
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newVaccine, setNewVaccine] = useState('');
  const [addingVaccine, setAddingVaccine] = useState(false);
  const [vaccines, setVaccines] = useState<string[]>([]);
  const [newDisease, setNewDisease] = useState('');
  const [addingDisease, setAddingDisease] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizeStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }

    if (typeof value === 'string' && value.trim()) {
      return [value.trim()];
    }

    return [];
  };

  const mergeAiProfile = (
    baseProfile: Record<string, unknown> | undefined,
    fallbackProfile: Record<string, unknown>
  ) => ({
    ...(baseProfile ?? {}),
    vaccines: (() => {
      const fromBackend = normalizeStringList(baseProfile?.vaccines);
      if (fromBackend.length > 0) return fromBackend;
      return normalizeStringList(fallbackProfile.vaccines);
    })(),
    medicalHistory: (() => {
      const fromBackend = normalizeStringList(baseProfile?.medicalHistory);
      if (fromBackend.length > 0) return fromBackend;
      return normalizeStringList(fallbackProfile.medicalHistory);
    })(),
  });

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

  useEffect(() => {
    setAi(pet.ai_profile ?? {});
    setVaccines(normalizeStringList(pet.ai_profile?.vaccines));
    setMedicalHistory(normalizeStringList(pet.ai_profile?.medicalHistory));
    setForm({
      name: pet.name,
      species: pet.species,
      status: pet.status,
      breed: pet.ai_profile?.breed ?? '',
      birthDate: pet.ai_profile?.birthDate ?? '',
      photoUrls: readPhotoUrls(pet.ai_profile),
      inChargeEmployeeId: pet.ai_profile?.inChargeEmployeeId ?? '',
      description: pet.description ?? '',
    });
    setEditMode(false);
    setErr(null);
  }, [pet.id]);

  const persistAi = async (updatedAi: Record<string, unknown>) => {
    const updated = await apiFetch<Pet>(`/api/pets/${pet.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ai_profile: updatedAi }),
    });

    const mergedAiProfile = mergeAiProfile(updated.ai_profile, updatedAi);
    const mergedPet: Pet = {
      ...updated,
      ai_profile: mergedAiProfile,
    };

    onUpdate(mergedPet);
    setAi(mergedAiProfile);
    setVaccines(normalizeStringList(mergedAiProfile.vaccines));
    setMedicalHistory(normalizeStringList(mergedAiProfile.medicalHistory));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    if (form.photoUrls.length + selectedFiles.length > MAX_PHOTOS) {
      setErr(`Solo puedes guardar hasta ${MAX_PHOTOS} fotos por mascota.`);
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
      setForm(prev => ({ ...prev, photoUrls: [...prev.photoUrls, ...urls] }));
      setErr(null);
    } catch {
      setErr('No se pudo cargar la imagen');
    } finally {
      e.target.value = '';
    }
  };

  const removePhotoAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSaveEdit = async () => {
    const cleanName = form.name.trim();
    const cleanSpecies = form.species.trim();

    if (!cleanName || !cleanSpecies) {
      setErr('Nombre y especie son obligatorios.');
      return;
    }

    const nextAi = {
      ...ai,
      breed: form.breed.trim(),
      photoUrls: form.photoUrls,
      photoUrl: form.photoUrls[0] ?? '',
      birthDate: form.birthDate,
      inChargeEmployeeId: form.inChargeEmployeeId || undefined,
    };

    try {
      setSaving(true);
      setErr(null);
      const updated = await apiFetch<Pet>(`/api/pets/${pet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: cleanName,
          species: cleanSpecies,
          status: form.status,
          description: form.description.trim() || null,
          ai_profile: nextAi,
        }),
      });
      const mergedAiProfile = mergeAiProfile(updated.ai_profile, nextAi);
      const mergedPet: Pet = {
        ...updated,
        ai_profile: mergedAiProfile,
      };

      onUpdate(mergedPet);
      setAi(mergedAiProfile);
      setVaccines(normalizeStringList(mergedAiProfile.vaccines));
      setMedicalHistory(normalizeStringList(mergedAiProfile.medicalHistory));
      setForm({
        name: mergedPet.name,
        species: mergedPet.species,
        status: mergedPet.status,
        breed: mergedPet.ai_profile?.breed ?? '',
        birthDate: mergedPet.ai_profile?.birthDate ?? '',
        photoUrls: readPhotoUrls(mergedPet.ai_profile),
        inChargeEmployeeId: mergedPet.ai_profile?.inChargeEmployeeId ?? '',
        description: mergedPet.description ?? '',
      });
      setEditMode(false);
    } catch (error: unknown) {
      setErr((error as Error).message ?? 'No se pudo guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar a ${pet.name}?`)) {
      onDelete(pet.id);
      setIsVisible(false);
      window.setTimeout(onClose, ANIMATION_MS);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(onClose, ANIMATION_MS);
  };

  const saveVaccine = async () => {
    const v = newVaccine.trim();
    if (!v) return;
    const nextVaccines = [...vaccines, v];
    const next = { ...ai, vaccines: nextVaccines };
    setVaccines(nextVaccines);
    setAi(next);
    try {
      await persistAi(next);
      setNewVaccine('');
      setAddingVaccine(false);
    } catch (error: unknown) {
      setErr((error as Error).message ?? 'No se pudo guardar la vacuna');
    }
  };

  const saveDisease = async () => {
    const d = newDisease.trim();
    if (!d) return;
    const nextHistory = [...medicalHistory, d];
    const next = { ...ai, medicalHistory: nextHistory };
    setMedicalHistory(nextHistory);
    setAi(next);
    try {
      await persistAi(next);
      setNewDisease('');
      setAddingDisease(false);
    } catch (error: unknown) {
      setErr((error as Error).message ?? 'No se pudo guardar el historial');
    }
  };

  const diseases: string[] = medicalHistory;

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
        className={`absolute right-3 top-3 bottom-3 w-[calc(100%-1.5rem)] sm:w-[min(calc(100%-1.5rem),46rem)] xl:w-[min(calc(100%-1.5rem),52rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Foto */}
        <div className="relative h-60 sm:h-64 xl:h-72 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-2">
          {form.photoUrls[0] ? (
            <img
              src={form.photoUrls[0]}
              alt={form.name}
              className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800 p-2"
            />
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-gray-400 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.2}
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="12" cy="12" r="3.5" />
                <path d="M3 8h2" />
              </svg>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Sin foto</span>
            </>
          )}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
          >
            <IconX />
          </button>
          {editMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 hover:bg-black/75 text-white"
              >
                Anadir fotos
              </button>
            </>
          )}
          <span
            className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
              form.status === 'available'
                ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                : form.status === 'pending'
                  ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                  : 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30'
            }`}
          >
            {form.status === 'available'
              ? 'Disponible'
              : form.status === 'pending'
                ? 'Pendiente'
                : 'Adoptado'}
          </span>
        </div>

        {/* Contenido */}
        <div className="p-5 xl:p-6 max-h-[64vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{form.name}</h2>
            {!editMode ? (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      name: pet.name,
                      species: pet.species,
                      status: pet.status,
                      breed: pet.ai_profile?.breed ?? '',
                      birthDate: pet.ai_profile?.birthDate ?? '',
                      photoUrls: readPhotoUrls(pet.ai_profile),
                      inChargeEmployeeId: pet.ai_profile?.inChargeEmployeeId ?? '',
                      description: pet.description ?? '',
                    });
                    setEditMode(false);
                    setErr(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>

          {editMode ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e =>
                    setForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Especie
                </label>
                <input
                  type="text"
                  value={form.species}
                  onChange={e =>
                    setForm(prev => ({ ...prev, species: e.target.value }))
                  }
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Raza
                </label>
                <input
                  type="text"
                  value={form.breed}
                  onChange={e =>
                    setForm(prev => ({ ...prev, breed: e.target.value }))
                  }
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Estado
                </label>
                <StyledSelect
                  value={form.status}
                  onChange={(value) =>
                    setForm(prev => ({
                      ...prev,
                      status: value as PetStatus,
                    }))
                  }
                  options={[
                    { value: 'available', label: 'Disponible' },
                    { value: 'pending', label: 'Pendiente' },
                    { value: 'adopted', label: 'Adoptado' },
                  ]}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de nacimiento
                </label>
                <StyledDatePicker
                  value={form.birthDate}
                  onChange={(date) =>
                    setForm(prev => ({ ...prev, birthDate: date }))
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Empleado encargado
                </label>
                <StyledSelect
                  value={form.inChargeEmployeeId}
                  onChange={(value) =>
                    setForm(prev => ({ ...prev, inChargeEmployeeId: value as string }))
                  }
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
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={e =>
                    setForm(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe las características, personalidad o información relevante de la mascota..."
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              <Row label="Nombre" value={form.name} />
              <Row label="Especie" value={form.species ?? null} />
              <Row label="Raza" value={form.breed || null} />
              <Row label="Fecha de nacimiento" value={fmtDate(form.birthDate)} />
              <Row
                label="Empleado a cargo"
                value={employees.find(e => e.id === form.inChargeEmployeeId)?.name || 'Ninguno'}
              />
              {form.description && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Descripción
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {form.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {err && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{err}</p>}

          {editMode && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Fotos ({form.photoUrls.length}/{MAX_PHOTOS})
              </p>
              {form.photoUrls.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">Sin fotos cargadas.</p>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {form.photoUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative group">
                      <img src={url} alt={`Foto ${index + 1}`} className="h-14 w-full rounded-md object-cover border border-gray-300 dark:border-gray-700" />
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
              )}
            </div>
          )}

          {/* Vacunas */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Vacunas
              </p>
              {!addingVaccine && (
                <button
                  type="button"
                  onClick={() => setAddingVaccine(true)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm transition-colors"
                >
                  +
                </button>
              )}
            </div>
            {vaccines.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {vaccines.map((v, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs"
                  >
                    {v}
                  </span>
                ))}
              </div>
            ) : (
              !addingVaccine && <NA label="Sin vacunas registradas" />
            )}
            {addingVaccine && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  value={newVaccine}
                  onChange={e => setNewVaccine(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveVaccine();
                    if (e.key === 'Escape') {
                      setAddingVaccine(false);
                      setNewVaccine('');
                    }
                  }}
                  placeholder="Nombre de vacuna"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                />
                <button
                  type="button"
                  onClick={saveVaccine}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs transition-colors"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingVaccine(false);
                    setNewVaccine('');
                  }}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <IconX />
                </button>
              </div>
            )}
          </div>

          {/* Historial de enfermedades */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Historial de enfermedades
              </p>
              {!addingDisease && (
                <button
                  type="button"
                  onClick={() => setAddingDisease(true)}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm transition-colors"
                >
                  +
                </button>
              )}
            </div>
            {diseases.length > 0 ? (
              <ul className="space-y-1 mb-2">
                {diseases.map((d, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-gray-400 dark:text-gray-600 mt-0.5">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              !addingDisease && <NA label="Sin historial registrado" />
            )}
            {addingDisease && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  autoFocus
                  value={newDisease}
                  onChange={e => setNewDisease(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveDisease();
                    if (e.key === 'Escape') {
                      setAddingDisease(false);
                      setNewDisease('');
                    }
                  }}
                  placeholder="Nombre de enfermedad"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                />
                <button
                  type="button"
                  onClick={saveDisease}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs transition-colors"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingDisease(false);
                    setNewDisease('');
                  }}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <IconX />
                </button>
              </div>
            )}
          </div>

          {/* Adopcion y empleado */}
          <div className="mt-4 space-y-0">
            <Row
              label="Fecha de adopcion"
              value={
                form.status === 'adopted'
                  ? fmtDate(ai.adoptionDate as string)
                  : null
              }
              placeholder={form.status !== 'adopted' ? '---' : undefined}
            />
            <Row
              label="Adoptante"
              value={
                form.status === 'adopted'
                  ? (String(ai.adopterName ?? '') || null)
                  : null
              }
              placeholder={form.status !== 'adopted' ? '---' : undefined}
            />
            <Row
              label="Empleado a cargo"
              value={employees.find(e => e.id === ai.inChargeEmployeeId)?.name || 'Ninguno'}
            />
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 py-2 text-sm font-medium hover:bg-red-500/20 transition-colors mt-5"
          >
            <IconTrash />
            Eliminar mascota
          </button>
        </div>
      </div>
    </div>
  );
}
