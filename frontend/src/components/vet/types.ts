export interface VetProfileForm {
  displayName: string;
  email: string;
  location: string;
  phone: string;
  website: string;
  description: string;
  avatarUrl: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
}

export type VetActiveView = 'pets' | 'monitoring' | 'matches' | 'employees' | 'chat' | 'profile' | 'reviews';
