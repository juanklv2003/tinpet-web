//solo puede haber estos valores exactos
export type UserRole = 'adopter' | 'shelter' | 'vet' | 'admin';
export type PetStatus = 'disponible' | 'pendiente' | 'adoptado' | 'available' | 'pending' | 'adopted';

// Usuario autenticado: payload del JWT
export interface AuthUser {
  id: string;    // users.id (sub del JWT)
  email: string;
  role: UserRole;
  name: string;
}

// Perfil normalizado: datos de la tabla correspondiente + role inyectado
export interface UserProfile {
  id: string;         // PK de la tabla (adopters / shelters / vet_clinics)
  user_id: string;    // FK a users.id
  name: string;
  role: UserRole;
  created_at?: string;
  [key: string]: any;
}

/** @deprecated — usar UserProfile. Conservado para no romper refs antiguas */
export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  lifestyle_data: Record<string, any>;
  created_at: string;
}

export interface Pet {
  id: string;
  shelter_id: string;//shelter_id es el id del perfil
  name: string;
  species: string;
  status: PetStatus;
  description?: string;
  ai_profile: Record<string, any>;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  pet_id: string;
  vet_id: string | null; 
  visit_date: string;
  weight: number;
  vaccines: string[];
  clinical_notes: string;
  created_at: string;
}
