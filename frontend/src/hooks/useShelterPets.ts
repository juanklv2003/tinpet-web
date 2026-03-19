import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import type { Pet, PetStatus } from '../types';

interface CreatePetPayload {
  name: string;
  species: string;
  status?: PetStatus;
  ai_profile?: Record<string, unknown>;
}

interface UseShelterPetsResult {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  handleAddPet: (payload: CreatePetPayload) => Promise<Pet | null>;
  handleTogglePetStatus: (petId: string) => Promise<Pet | null>;
}

export function useShelterPets(): UseShelterPetsResult {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Pet[]>('/api/pets');
      setPets(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las mascotas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddPet = useCallback(async (payload: CreatePetPayload) => {
    setLoading(true);
    setError(null);
    try {
      const created = await apiFetch<Pet>('/api/pets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPets((prev) => [created, ...prev]);
      return created;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo crear la mascota';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTogglePetStatus = useCallback(async (petId: string) => {
    setLoading(true);
    setError(null);

    const currentPet = pets.find((pet) => pet.id === petId);
    if (!currentPet) {
      setLoading(false);
      setError('Mascota no encontrada');
      return null;
    }

    const nextStatus: PetStatus = currentPet.status === 'adopted' ? 'available' : 'adopted';

    try {
      const updated = await apiFetch<Pet>(`/api/pets/${petId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setPets((prev) => prev.map((pet) => (pet.id === petId ? updated : pet)));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar el estado';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [pets]);

  useEffect(() => {
    void fetchPets();
  }, [fetchPets]);

  return {
    pets,
    loading,
    error,
    fetchPets,
    handleAddPet,
    handleTogglePetStatus,
  };
}
