import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export type MatchStatus = 'pending' | 'accepted' | 'rejected';

export interface MatchRequest {
  id: string;
  pet_id: string;
  adopter_id: string;
  status: MatchStatus;
  created_at?: string;
  pet_name?: string;
  user_name?: string;
  adopter?: {
    id: string;
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    photos?: string[];
    description?: string;
    housing_type?: string;
    has_other_pets?: boolean;
    other_pets_desc?: string;
    pet_experience?: string;
    has_children?: boolean;
    hours_at_home?: string;
    work_from_home?: boolean;
    hobbies?: string[];
  };
  [key: string]: unknown;
}

interface UseShelterMatchesResult {
  matches: MatchRequest[];
  loading: boolean;
  error: string | null;
  fetchMatches: () => Promise<void>;
  handleAcceptMatch: (matchId: string) => Promise<MatchRequest | null>;
  handleRejectMatch: (matchId: string) => Promise<MatchRequest | null>;
}

interface UseShelterMatchesOptions {
  autoFetch?: boolean;
}

export function useShelterMatches(options?: UseShelterMatchesOptions): UseShelterMatchesResult {
  const autoFetch = options?.autoFetch ?? true;
  const [matches, setMatches] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (matches.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await apiFetch<MatchRequest[]>('/api/matches');
      setMatches(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [matches.length]);

  const updateMatchStatus = useCallback(async (matchId: string, status: Exclude<MatchStatus, 'pending'>) => {
    setError(null);
    try {
      const updated = await apiFetch<MatchRequest>(`/api/matches/${matchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMatches((prev) => prev.map((match) => (match.id === matchId ? updated : match)));
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar la solicitud';
      setError(message);
      return null;
    }
  }, []);

  const handleAcceptMatch = useCallback(async (matchId: string) => {
    return updateMatchStatus(matchId, 'accepted');
  }, [updateMatchStatus]);

  const handleRejectMatch = useCallback(async (matchId: string) => {
    return updateMatchStatus(matchId, 'rejected');
  }, [updateMatchStatus]);

  useEffect(() => {
    if (!autoFetch) return;
    void fetchMatches();
  }, [autoFetch, fetchMatches]);

  return {
    matches,
    loading,
    error,
    fetchMatches,
    handleAcceptMatch,
    handleRejectMatch,
  };
}
