import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import type { Pet } from '../types';

export const usePets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Pet[]>('/api/pets');
        setPets(data);
      } catch (err: any) {
        setError(err.message || 'Error loading pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  return { pets, loading, error };
};