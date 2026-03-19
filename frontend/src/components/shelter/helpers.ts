import type { PetStatus } from '../../types';

// Helpers para el dashboard (sin JSX)

export const statusLabel: Record<PetStatus, string> = {
  available: 'Disponible',
  pending: 'Pendiente',
  adopted: 'Adoptado',
};

export const statusDotColor: Record<PetStatus, string> = {
  available: 'bg-emerald-400',
  pending: 'bg-amber-400',
  adopted: 'bg-sky-400',
};

export const statusBadgeColor: Record<PetStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  adopted: 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30',
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
