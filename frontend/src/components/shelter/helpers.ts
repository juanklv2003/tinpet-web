import type { Pet, PetStatus } from '../../types';

// Helpers para el dashboard (sin JSX)

export const DEFAULT_PHOTO_FOCUS = 'center';

export const PHOTO_FOCUS_OPTIONS = [
  { value: 'top left', label: 'Arriba izquierda' },
  { value: 'top', label: 'Arriba' },
  { value: 'top right', label: 'Arriba derecha' },
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
  { value: 'bottom left', label: 'Abajo izquierda' },
  { value: 'bottom', label: 'Abajo' },
  { value: 'bottom right', label: 'Abajo derecha' },
] as const;

const PHOTO_FOCUS_VALUES = new Set(PHOTO_FOCUS_OPTIONS.map((option) => option.value));

export function normalizePhotoFocus(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_PHOTO_FOCUS;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return DEFAULT_PHOTO_FOCUS;
  return PHOTO_FOCUS_VALUES.has(normalized) ? normalized : DEFAULT_PHOTO_FOCUS;
}

export function readPetPhotoUrls(aiProfile: Record<string, unknown> | undefined): string[] {
  const fromArray = aiProfile?.photoUrls;
  if (Array.isArray(fromArray)) {
    return fromArray.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof aiProfile?.photoUrl === 'string' && aiProfile.photoUrl.trim()) {
    return [aiProfile.photoUrl.trim()];
  }

  return [];
}

export function readPetPhotoFocusPoints(
  aiProfile: Record<string, unknown> | undefined,
  photoCount = readPetPhotoUrls(aiProfile).length,
): string[] {
  const raw = aiProfile?.photoFocusPoints ?? aiProfile?.photoPositions ?? aiProfile?.photoFocus ?? aiProfile?.photoPosition;

  let values: string[] = [];
  if (Array.isArray(raw)) {
    values = raw.map((item) => normalizePhotoFocus(item));
  } else if (typeof raw === 'string') {
    values = [normalizePhotoFocus(raw)];
  }

  if (photoCount <= 0) {
    return values.length > 0 ? values : [];
  }

  const next = values.slice(0, photoCount);
  while (next.length < photoCount) {
    next.push(DEFAULT_PHOTO_FOCUS);
  }
  return next;
}

export function getPrimaryPetPhoto(pet: Pet): { src: string | null; focus: string } {
  const photoUrls = readPetPhotoUrls(pet.ai_profile);
  const photoFocusPoints = readPetPhotoFocusPoints(pet.ai_profile, photoUrls.length);

  return {
    src: photoUrls[0] ?? null,
    focus: photoFocusPoints[0] ?? DEFAULT_PHOTO_FOCUS,
  };
}

export const statusLabel: Record<PetStatus, string> = {
  available: 'Disponible',
  pending: 'Pendiente',
  adopted: 'Adoptado',
  disponible: 'Disponible',
  pendiente: 'Pendiente',
  adoptado: 'Adoptado',
};

export const statusDotColor: Record<PetStatus, string> = {
  available: 'bg-emerald-400',
  pending: 'bg-amber-400',
  adopted: 'bg-sky-400',
  disponible: 'bg-emerald-400',
  pendiente: 'bg-amber-400',
  adoptado: 'bg-sky-400',
};

export const statusBadgeColor: Record<PetStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  adopted: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
  disponible: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  pendiente: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  adoptado: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
};

export function fmtDate(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const base = new Date(iso).getTime();
  if (Number.isNaN(base)) return null;
  const ms = Date.now() - base;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });
}
