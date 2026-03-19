import { useState, useEffect, useRef } from 'react';
import { IconTrash, IconX } from '../Icons';
import { fileToDataUrl, fmtDate } from '../helpers';
import { NA } from '../components/NA';
import { Row } from '../components/Row';
import { apiFetch } from '../../../services/api';
import type { EditPetForm, PetStatus } from '../types';
import type { Pet } from '../../../types';

interface PetProfileModalProps {
  pet: Pet;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: Pet) => void;
}

export function PetProfileModal({
  pet,
  onClose,
  onDelete,
  onUpdate,
}: PetProfileModalProps) {
  const [ai, setAi] = useState<Record<string, unknown>>(pet.ai_profile ?? {});
  const [form, setForm] = useState<EditPetForm>({
    name: pet.name,
    species: pet.species,
    status: pet.status,
    breed: pet.ai_profile?.breed ?? '',
    birthDate: pet.ai_profile?.birthDate ?? '',
    photoUrl: pet.ai_profile?.photoUrl ?? '',
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [newVaccine, setNewVaccine] = useState('');
  const [addingVaccine, setAddingVaccine] = useState(false);
  const [newDisease, setNewDisease] = useState('');
  const [addingDisease, setAddingDisease] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAi(pet.ai_profile ?? {});
    setForm({
      name: pet.name,
      species: pet.species,
      status: pet.status,
      breed: pet.ai_profile?.breed ?? '',
      birthDate: pet.ai_profile?.birthDate ?? '',
      photoUrl: pet.ai_profile?.photoUrl ?? '',
    });
    setEditMode(false);
    setErr(null);
  }, [pet]);

  const persistAi = async (updatedAi: Record<string, unknown>) => {
    const updated = await apiFetch<Pet>(`/api/pets/${pet.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ai_profile: updatedAi }),
    });
    onUpdate(updated);
    setAi(updated.ai_profile ?? updatedAi);
  };

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
      setForm(prev => ({ ...prev, photoUrl: dataUrl }));
      setErr(null);
    } catch {
      setErr('No se pudo cargar la imagen');
    }
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
      photoUrl: form.photoUrl,
      birthDate: form.birthDate,
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
          ai_profile: nextAi,
        }),
      });
      onUpdate(updated);
      setAi(updated.ai_profile ?? nextAi);
      setForm({
        name: updated.name,
        species: updated.species,
        status: updated.status,
        breed: updated.ai_profile?.breed ?? '',
        birthDate: updated.ai_profile?.birthDate ?? '',
        photoUrl: updated.ai_profile?.photoUrl ?? '',
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
      onClose();
    }
  };

  const saveVaccine = async () => {
    const v = newVaccine.trim();
    if (!v) return;
    const vaccines = [...((ai.vaccines as string[]) ?? []), v];
    const next = { ...ai, vaccines };
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
    const currentHistory = ai.medicalHistory;
    const medicalHistory = Array.isArray(currentHistory)
      ? currentHistory
      : currentHistory
        ? [currentHistory]
        : [];
    const updatedHistory = [...medicalHistory, d];
    const next = { ...ai, medicalHistory: updatedHistory };
    setAi(next);
    try {
      await persistAi(next);
      setNewDisease('');
      setAddingDisease(false);
    } catch (error: unknown) {
      setErr((error as Error).message ?? 'No se pudo guardar el historial');
    }
  };

  const vaccines: string[] = Array.isArray(ai.vaccines) ? ai.vaccines : [];
  const diseases: string[] = Array.isArray(ai.medicalHistory)
    ? ai.medicalHistory
    : ai.medicalHistory
      ? [String(ai.medicalHistory)]
      : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Foto */}
        <div className="relative h-44 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-2">
          {form.photoUrl ? (
            <img
              src={form.photoUrl}
              alt={form.name}
              className="w-full h-full object-cover"
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
            onClick={onClose}
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
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 hover:bg-black/75 text-white"
              >
                Cambiar foto
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
        <div className="p-5 max-h-[62vh] overflow-y-auto">
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
                      photoUrl: pet.ai_profile?.photoUrl ?? '',
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
                <select
                  value={form.status}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      status: e.target.value as PetStatus,
                    }))
                  }
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                >
                  <option value="available">Disponible</option>
                  <option value="pending">Pendiente</option>
                  <option value="adopted">Adoptado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e =>
                    setForm(prev => ({ ...prev, birthDate: e.target.value }))
                  }
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              <Row label="Nombre" value={form.name} />
              <Row label="Especie" value={form.species ?? null} />
              <Row label="Raza" value={form.breed || null} />
              <Row label="Fecha de nacimiento" value={fmtDate(form.birthDate)} />
            </div>
          )}

          {err && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{err}</p>}

          {/* Vacunas */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Vacunas
              </p>
              {!addingVaccine && (
                <button
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
                  onClick={saveVaccine}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs transition-colors"
                >
                  OK
                </button>
                <button
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
                  onClick={saveDisease}
                  className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs transition-colors"
                >
                  OK
                </button>
                <button
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
              value={String(ai.assignedEmployee ?? '') || null}
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
