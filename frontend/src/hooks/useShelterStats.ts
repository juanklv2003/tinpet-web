import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export interface ShelterStats {
  totalPets: number;
  totalLikesReceived: number;
  closedAdoptions: number;
}

interface UseShelterStatsResult {
  stats: ShelterStats;
  loading: boolean;
  error: string | null;
  fetchStats: () => Promise<void>;
}

interface UseShelterStatsOptions {
  autoFetch?: boolean;
}

const initialStats: ShelterStats = {
  totalPets: 0,
  totalLikesReceived: 0,
  closedAdoptions: 0,
};

export function useShelterStats(options?: UseShelterStatsOptions): UseShelterStatsResult {
  const autoFetch = options?.autoFetch ?? true;
  const [stats, setStats] = useState<ShelterStats>(initialStats);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<Record<string, unknown>>('/api/stats');
      setStats({
        totalPets: Number(data.totalPets ?? data.total_pets ?? 0),
        totalLikesReceived: Number(data.totalLikesReceived ?? data.total_likes_received ?? 0),
        closedAdoptions: Number(data.closedAdoptions ?? data.adoptionsClosed ?? data.closed_adoptions ?? 0),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las estadisticas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    void fetchStats();
  }, [autoFetch, fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
}
