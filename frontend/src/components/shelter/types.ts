import type { PetStatus } from '../../types';

export type { PetStatus };

// Tipos locales para el dashboard de shelter
export interface AddPetForm {
  name: string;
  species: string;
  breed: string;
  size: string;
  photoUrls: string[];
  photoFiles: File[];
  birthDate: string;
  intakeDate: string;
  status: PetStatus;
  inChargeEmployeeId: string;
  description: string;
}

export const emptyAddForm: AddPetForm = {
  name: '',
  species: '',
  breed: '',
  size: '',
  photoUrls: [],
  photoFiles: [],
  birthDate: '',
  intakeDate: '',
  status: 'available',
  inChargeEmployeeId: '',
  description: '',
};

export interface EditPetForm {
  name: string;
  species: string;
  status: PetStatus;
  breed: string;
  size: string;
  birthDate: string;
  photoUrls: string[];
  inChargeEmployeeId: string;
  description: string;
}

export interface ShelterProfileForm {
  displayName: string;
  email: string;
  location: string;
  phone: string;
  website: string;
  description: string;
  avatarUrl: string;
  googleMaps: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  rescuedPets?: string;
  adoptedPets?: string;
  activeVolunteers?: string;
}

export type ActiveView = 'pets' | 'monitoring' | 'matches' | 'employees' | 'chat' | 'profile' | 'reviews' | 'settings';
export type PetsSort = 'newest' | 'oldest' | 'name';

