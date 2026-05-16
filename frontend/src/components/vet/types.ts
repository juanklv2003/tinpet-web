export interface VetProfileForm {
  displayName: string;
  email: string;
  location: string;
  phone: string;
  description: string;
  avatarUrl: string;
}

export type VetActiveView = 'pets' | 'monitoring' | 'matches' | 'employees' | 'chat' | 'profile';
