import { useEffect, useState } from 'react';
import { useShelterEmployees } from '../../../hooks/useShelterEmployees';
import { useShelterMatches } from '../../../hooks/useShelterMatches';
import { useShelterStats } from '../../../hooks/useShelterStats';
import { apiFetch } from '../../../services/api';
import type { AuthUser, Pet } from '../../../types';
import { fileToDataUrl } from '../helpers';
import type { ActiveView, AddPetForm, ShelterProfileForm } from '../types';

interface UseShelterDashboardLogicResult {
  activeView: ActiveView;
  setActiveView: React.Dispatch<React.SetStateAction<ActiveView>>;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPet: Pet | null;
  setSelectedPet: React.Dispatch<React.SetStateAction<Pet | null>>;
  profileForm: ShelterProfileForm;
  profileDirty: boolean;
  profileSaveMsg: string | null;
  profileError: string | null;
  fetchMyPets: () => Promise<void>;
  updateProfileField: (field: keyof ShelterProfileForm, value: string) => void;
  handleProfilePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  saveProfile: () => void;
  handleAddPet: (form: AddPetForm) => Promise<void>;
  handleDeletePet: (petId: string) => Promise<void>;
  stats: { totalPets: number; totalLikesReceived: number; closedAdoptions: number };
  statsLoading: boolean;
  statsError: string | null;
  fetchStats: () => Promise<void>;
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

export function useShelterDashboardLogic(user: AuthUser | null): UseShelterDashboardLogicResult {
  const [activeView, setActiveView] = useState<ActiveView>('pets');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  const profileStorageKey = user?.id ? `tinpet-profile-${user.id}` : null;
  const [profileForm, setProfileForm] = useState<ShelterProfileForm>({
    displayName: user?.name ?? '',
    email: user?.email ?? '',
    location: '',
    phone: '',
    website: '',
    description: '',
    avatarUrl: '',
    googleMaps: '',
    instagram: '',
    tiktok: '',
    facebook: '',
    youtube: '',
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

  const fetchMyPets = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Pet[]>('/api/pets/mine');
      setPets(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

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
    if (activeView === 'employees') {
      void fetchEmployees();
    }
  }, [user?.id, activeView, fetchStats, fetchMatches, fetchEmployees]);

  useEffect(() => {
    if (!user?.id || !profileStorageKey) return;

    const fallback: ShelterProfileForm = {
      displayName: user.name ?? '',
      email: user.email ?? '',
      location: '',
      phone: '',
      website: '',
      description: '',
      avatarUrl: '',
      googleMaps: '',
      instagram: '',
      tiktok: '',
      facebook: '',
      youtube: '',
    };

    try {
      const raw = localStorage.getItem(profileStorageKey);
      if (!raw) {
        setProfileForm(fallback);
      } else {
        const parsed = JSON.parse(raw) as Partial<ShelterProfileForm>;
        setProfileForm({
          displayName: parsed.displayName ?? fallback.displayName,
          email: parsed.email ?? fallback.email,
          location: parsed.location ?? '',
          phone: parsed.phone ?? '',
          website: parsed.website ?? '',
          description: parsed.description ?? '',
          avatarUrl: parsed.avatarUrl ?? '',
          googleMaps: parsed.googleMaps ?? '',
          instagram: parsed.instagram ?? '',
          tiktok: parsed.tiktok ?? '',
          facebook: parsed.facebook ?? '',
          youtube: parsed.youtube ?? '',
        });
      }
    } catch {
      setProfileForm(fallback);
    }

    setProfileDirty(false);
    setProfileSaveMsg(null);
    setProfileError(null);
  }, [user?.id, user?.name, user?.email, profileStorageKey]);

  const updateProfileField = (field: keyof ShelterProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileDirty(true);
    setProfileSaveMsg(null);
    setProfileError(null);
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
      const dataUrl = await fileToDataUrl(file);
      updateProfileField('avatarUrl', dataUrl);
    } catch {
      setProfileError('No se pudo cargar la foto de perfil.');
    }
  };

  const saveProfile = () => {
    if (!profileStorageKey) return;

    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(profileForm));
      setProfileDirty(false);
      setProfileSaveMsg('Perfil guardado correctamente.');
      setProfileError(null);
    } catch {
      setProfileError('No se pudo guardar el perfil en este navegador.');
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
    sidebarOpen,
    setSidebarOpen,
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
    fetchStats,
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
