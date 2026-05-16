import { useCallback, useEffect, useState } from 'react';
import { useShelterEmployees } from '../../../hooks/useShelterEmployees';
import { useShelterMatches } from '../../../hooks/useShelterMatches';
import { useShelterStats } from '../../../hooks/useShelterStats';
import { API_BASE_URL, apiFetch } from '../../../services/api';
import type { AuthUser, Pet } from '../../../types';
import type { AddPetForm } from '../../shelter/types';
import type { VetActiveView, VetProfileForm } from '../types';

interface UseVetDashboardLogicResult {
  activeView: VetActiveView;
  setActiveView: React.Dispatch<React.SetStateAction<VetActiveView>>;
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPet: Pet | null;
  setSelectedPet: React.Dispatch<React.SetStateAction<Pet | null>>;
  profileForm: VetProfileForm;
  profileDirty: boolean;
  profileSaveMsg: string | null;
  profileError: string | null;
  fetchMyPets: () => Promise<void>;
  updateProfileField: (field: keyof VetProfileForm, value: string) => void;
  handleProfilePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  saveProfile: () => Promise<void>;
  handleAddPet: (form: AddPetForm) => Promise<void>;
  handleDeletePet: (petId: string) => Promise<void>;
  stats: { totalPets: number; totalLikesReceived: number; closedAdoptions: number };
  statsLoading: boolean;
  statsError: string | null;
  matches: Array<{
    id: string;
    pet_id: string;
    adopter_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at?: string;
    [key: string]: unknown;
  }>;
  matchesLoading: boolean;
  matchesError: string | null;
  handleAcceptMatch: (matchId: string) => Promise<unknown>;
  handleRejectMatch: (matchId: string) => Promise<unknown>;
  employees: Array<{
    id: string;
    shelter_id: string;
    name: string;
    email: string;
    role?: string;
    created_at?: string;
    [key: string]: unknown;
  }>;
  employeesLoading: boolean;
  employeesError: string | null;
  handleAddEmployee: (payload: { name: string; email: string; role?: string }) => Promise<unknown>;
}

export function useVetDashboardLogic(user: AuthUser | null): UseVetDashboardLogicResult {
  const [activeView, setActiveView] = useState<VetActiveView>('pets');
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const profileStorageKey = user?.id ? `tinpet-vet-profile-${user.id}` : null;
  const [profileForm, setProfileForm] = useState<VetProfileForm>({
    displayName: user?.name ?? '',
    email: user?.email ?? '',
    location: '',
    phone: '',
    description: '',
    avatarUrl: '',
  });
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    fetchStats,
  } = useShelterStats({ autoFetch: false });

  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    fetchMatches,
    handleAcceptMatch,
    handleRejectMatch,
  } = useShelterMatches({ autoFetch: false });

  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
    fetchEmployees,
    handleAddEmployee,
  } = useShelterEmployees({ autoFetch: false });

  const fetchMyPets = useCallback(async () => {
    if (!user?.id) return;
    if (pets.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await apiFetch<Pet[]>('/api/pets/mine');
      setPets(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [pets.length, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (activeView === 'pets' || activeView === 'monitoring') {
      void fetchMyPets();
    }
    if (activeView === 'monitoring') {
      void fetchStats();
    }
    if (activeView === 'matches') {
      void fetchMatches();
    }
    if (activeView === 'employees' || activeView === 'pets' || isAddModalOpen) {
      void fetchEmployees();
    }
  }, [user?.id, activeView, isAddModalOpen, fetchMyPets, fetchStats, fetchMatches, fetchEmployees]);

  // Restore from localStorage on mount
  useEffect(() => {
    if (!user?.id || !profileStorageKey) return;

    const fallback: VetProfileForm = {
      displayName: user.name ?? '',
      email: user.email ?? '',
      location: '',
      phone: '',
      description: '',
      avatarUrl: '',
    };

    try {
      const raw = localStorage.getItem(profileStorageKey);
      if (!raw) {
        setProfileForm(fallback);
      } else {
        const parsed = JSON.parse(raw) as Partial<VetProfileForm>;
        setProfileForm({
          displayName: parsed.displayName ?? fallback.displayName,
          email: parsed.email ?? fallback.email,
          location: parsed.location ?? '',
          phone: parsed.phone ?? '',
          description: parsed.description ?? '',
          avatarUrl: parsed.avatarUrl ?? '',
        });
      }
    } catch {
      setProfileForm(fallback);
    }

    setProfileDirty(false);
    setProfileSaveMsg(null);
    setProfileError(null);
  }, [user?.id, user?.name, user?.email, profileStorageKey]);

  const updateProfileField = (field: keyof VetProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileDirty(true);
    setProfileSaveMsg(null);
    setProfileError(null);
  };

  const uploadProfileImage = async (file: File): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa para subir la imagen.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        typeof payload?.error === 'string'
          ? payload.error
          : 'No se pudo subir la imagen a Cloudinary.';
      throw new Error(message);
    }

    if (typeof payload?.url !== 'string' || !payload.url.trim()) {
      throw new Error('La subida no devolvió una URL válida.');
    }

    return payload.url;
  };

  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('El archivo debe ser una imagen.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setProfileError('La imagen es demasiado grande. Usa una de menos de 4MB.');
      return;
    }

    try {
      setProfileSaveMsg('Subiendo foto...');
      const cloudinaryUrl = await uploadProfileImage(file);
      updateProfileField('avatarUrl', cloudinaryUrl);
      setProfileSaveMsg('Foto subida. Pulsa "Guardar cambios" para confirmar.');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo subir la foto de perfil.';
      setProfileError(message);
      setProfileSaveMsg(null);
    }
  };

  const saveProfile = async () => {
    if (!profileStorageKey) return;

    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(profileForm));

      // Save avatar to backend via vet-clinics endpoint
      if (profileForm.avatarUrl) {
        await apiFetch('/api/vet-clinics/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatar_url: profileForm.avatarUrl }),
        });
      }

      setProfileDirty(false);
      setProfileSaveMsg('Perfil guardado correctamente.');
      setProfileError(null);
    } catch {
      setProfileError('No se pudo guardar el perfil.');
      setProfileSaveMsg(null);
    }
  };

  const handleAddPet = async (form: AddPetForm) => {
    if (!user?.id) return;

    const ai_profile: Record<string, unknown> = {};
    if (form.breed) ai_profile.breed = form.breed;
    if (form.photoUrls.length > 0) {
      ai_profile.photoUrls = form.photoUrls;
      ai_profile.photoUrl = form.photoUrls[0];
    }
    if (form.birthDate) ai_profile.birthDate = form.birthDate;
    if (form.intakeDate) ai_profile.intakeDate = form.intakeDate;

    const newPet = await apiFetch<Pet>('/api/pets', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        species: form.species,
        status: form.status,
        description: form.description,
        ai_profile,
      }),
    });

    setPets((prev) => [newPet, ...prev]);
  };

  const handleDeletePet = async (petId: string) => {
    try {
      await apiFetch(`/api/pets/${petId}`, { method: 'DELETE' });
      setPets((prev) => prev.filter((p) => p.id !== petId));
      if (selectedPet?.id === petId) setSelectedPet(null);
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return {
    activeView,
    setActiveView,
    pets,
    setPets,
    loading,
    error,
    isAddModalOpen,
    setIsAddModalOpen,
    selectedPet,
    setSelectedPet,
    profileForm,
    profileDirty,
    profileSaveMsg,
    profileError,
    fetchMyPets,
    updateProfileField,
    handleProfilePhotoSelect,
    saveProfile,
    handleAddPet,
    handleDeletePet,
    stats,
    statsLoading,
    statsError,
    matches,
    matchesLoading,
    matchesError,
    handleAcceptMatch,
    handleRejectMatch,
    employees,
    employeesLoading,
    employeesError,
    handleAddEmployee,
  };
}
