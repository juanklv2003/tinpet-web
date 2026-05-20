import { useCallback, useEffect, useState } from 'react';
import { useShelterEmployees } from '../../../hooks/useShelterEmployees';
import { useShelterMatches } from '../../../hooks/useShelterMatches';
import { useShelterStats } from '../../../hooks/useShelterStats';
import { API_BASE_URL, apiFetch } from '../../../services/api';
import type { AuthUser, Pet } from '../../../types';
import type { AddPetForm } from '../../shelter/types';
import type { VetActiveView, VetProfileForm } from '../types';
import { useToast } from '../../dashboard/ToastProvider';
import { useTranslation } from '../../../i18n/useTranslation';

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
  handleProfilePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCropCancel: () => void;
  handleCropConfirm: (croppedBlob: Blob) => Promise<void>;
  cropImageSrc: string | null;
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
  const { showToast, updateToast } = useToast();
  const t = useTranslation();
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
    website: '',
    description: '',
    avatarUrl: '',
    instagram: '',
    facebook: '',
    youtube: '',
    tiktok: '',
  });
  const [profileDirty, setProfileDirty] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

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

  // Restore from localStorage and sync from backend on mount
  useEffect(() => {
    if (!user?.id || !profileStorageKey) return;

    const fallback: VetProfileForm = {
      displayName: user.name ?? '',
      email: user.email ?? '',
      location: '',
      phone: '',
      website: '',
      description: '',
      avatarUrl: '',
      instagram: '',
      facebook: '',
      youtube: '',
      tiktok: '',
    };

    const loadProfile = async () => {
      // First populate with localStorage (if any) so the user doesn't see a completely blank screen
      try {
        const raw = localStorage.getItem(profileStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<VetProfileForm>;
          setProfileForm({
            displayName: parsed.displayName ?? fallback.displayName,
            email: parsed.email ?? fallback.email,
            location: parsed.location ?? '',
            phone: parsed.phone ?? '',
            website: parsed.website ?? '',
            description: parsed.description ?? '',
            avatarUrl: parsed.avatarUrl ?? '',
            instagram: parsed.instagram ?? '',
            facebook: parsed.facebook ?? '',
            youtube: parsed.youtube ?? '',
            tiktok: parsed.tiktok ?? '',
          });
        } else {
          setProfileForm(fallback);
        }
      } catch {
        setProfileForm(fallback);
      }

      // Then fetch the source of truth from backend
      try {
        const data = await apiFetch<{ name?: string; email?: string; location?: string; phone?: string; website?: string; description?: string; avatar_url?: string; instagram?: string; facebook?: string }>('/api/vet-clinics/profile');
        if (data) {
          const backendProfile: VetProfileForm = {
            displayName: data.name ?? fallback.displayName,
            email: data.email ?? fallback.email,
            location: data.location ?? '',
            phone: data.phone ?? '',
            website: data.website ?? '',
            description: data.description ?? '',
            avatarUrl: data.avatar_url ?? '',
            instagram: data.instagram ?? '',
            facebook: data.facebook ?? '',
            youtube: '',
            tiktok: '',
          };
          setProfileForm(backendProfile);
          localStorage.setItem(profileStorageKey, JSON.stringify(backendProfile));
        }
      } catch (err) {
        console.error('Error fetching vet clinic profile:', err);
      }

      setProfileDirty(false);
      setProfileSaveMsg(null);
      setProfileError(null);
    };

    void loadProfile();
  }, [user?.id, user?.name, user?.email, profileStorageKey]);

  const updateProfileField = (field: keyof VetProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileDirty(true);
    setProfileSaveMsg(null);
    setProfileError(null);
  };

  const uploadImageBlob = async (blob: Blob): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa para subir la imagen.');
    }

    const formData = new FormData();
    formData.append('file', blob, 'profile.jpg');

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

  const handleProfilePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const errMsg = 'El archivo debe ser una imagen.';
      setProfileError(errMsg);
      showToast(errMsg, 'error');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      const errMsg = 'La imagen es demasiado grande. Usa una de menos de 4MB.';
      setProfileError(errMsg);
      showToast(errMsg, 'error');
      return;
    }

    // Read file as data URL and show crop modal instead of uploading directly
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    let toastId = 0;
    try {
      toastId = showToast(t('profile.toast.updatingPhoto'), 'loading');
      setProfileSaveMsg('Subiendo foto...');
      const cloudinaryUrl = await uploadImageBlob(croppedBlob);
      updateProfileField('avatarUrl', cloudinaryUrl);
      setCropImageSrc(null);
      setProfileSaveMsg('Foto subida. Pulsa "Guardar cambios" para confirmar.');
      updateToast(toastId, t('profile.common.successToast'), 'success');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No se pudo subir la foto de perfil.';
      setProfileError(message);
      setProfileSaveMsg(null);
      setCropImageSrc(null);
      if (toastId) {
        updateToast(toastId, message, 'error');
      } else {
        showToast(message, 'error');
      }
    }
  };

  const saveProfile = async () => {
    if (!profileStorageKey) return;

    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(profileForm));

      // Save profile to backend via vet-clinics endpoint
      await apiFetch('/api/vet-clinics/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.displayName,
          email: profileForm.email,
          location: profileForm.location,
          phone: profileForm.phone,
          website: profileForm.website || null,
          description: profileForm.description,
          avatar_url: profileForm.avatarUrl || null,
          instagram: profileForm.instagram || null,
          facebook: profileForm.facebook || null,
        }),
      });

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
    handleCropCancel,
    handleCropConfirm,
    cropImageSrc,
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
