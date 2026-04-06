import type { PetStatus } from '../../types';

export type { PetStatus };

// Tipos locales para el dashboard de shelter
export interface AddPetForm {
  name: string;
  species: string;
  breed: string;
  photoUrls: string[];
  photoFiles: File[];
  birthDate: string;
  intakeDate: string;
  status: PetStatus;
}

export const emptyAddForm: AddPetForm = {
  name: '',
  species: '',
  breed: '',
  photoUrls: [],
  photoFiles: [],
  birthDate: '',
  intakeDate: '',
  status: 'available',
};

export interface EditPetForm {
  name: string;
  species: string;
  status: PetStatus;
  breed: string;
  birthDate: string;
  photoUrls: string[];
}

export interface ShelterProfileForm {
  displayName: string;
  email: string;
  location: string;
  phone: string;
  website: string;
  description: string;
  avatarUrl: string;
}

export type ActiveView = 'pets' | 'monitoring' | 'matches' | 'employees' | 'chat' | 'profile';
export type PetsSort = 'newest' | 'oldest' | 'name';
