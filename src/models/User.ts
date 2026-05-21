// src/models/User.ts
// Modèle principal utilisateur ProDay

export type UserRole = 'player' | 'coach' | 'agent' | 'organizer' | 'sponsor';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_REQUIRED';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface WorkExperience {
  id: string;
  title: string;
  organization: string;
  period: string;
  description?: string;
}

export interface DiplomaRecord {
  id: string;
  name: string;
  institution: string;
  year?: number;
  verified: boolean;
  status?: 'verified' | 'pending' | 'to_verify';
}

export interface ProfileReview {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface UserDocument {
  id: string;
  type: 'diploma' | 'license' | 'id' | 'other';
  storage_url: string;
  uploaded_at: Date;
  reviewed_at?: Date;
  reviewer_uid?: string;
  rejection_reason?: string;
}

export interface UserProfile {
  // Joueur
  position?: string;          // Attaquant, Défenseur, Milieu, Gardien
  category?: string;          // U15, U17, U19, Seniors, Vétérans
  level?: string;             // Départemental, R3, R2, R1, N3, N2, N1
  strong_foot?: 'left' | 'right' | 'both';
  height_cm?: number;
  weight_kg?: number;
  highlight_video_urls?: string[];
  gallery_urls?: string[];
  age?: number;
  years_experience?: number;
  availability?: 'available' | 'unavailable' | 'negotiating';
  season_stats?: {
    matches: number;
    goals: number;
    assists: number;
  };
  
  // Coach / Agent
  diploma?: string;           // BEF, BFF, BMF, UEFA B/A, etc.
  license_number?: string;
  job_title?: string;         // ex. Préparateur physique, Agent FIFA
  specialties?: string[];
  experiences?: WorkExperience[];
  diplomas_list?: DiplomaRecord[];
  reviews?: ProfileReview[];
  rating?: number;            // moyenne 1–5
  
  // Commun
  bio?: string;
  club_id?: string;
  achievements?: string[];
}

export interface User {
  uid: string;
  display_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  
  // Vérification
  is_verified: boolean;
  verification_status: VerificationStatus;
  verification_date?: Date;
  
  // Géolocalisation
  location?: GeoPoint;
  city?: string;
  department?: string;
  
  // Profil étendu
  profile: UserProfile;
  documents: UserDocument[];
  
  // Métadonnées
  created_at: Date;
  updated_at: Date;
  last_active_at?: Date;
  is_active: boolean;
  
  // Notifications
  fcm_token?: string;
  notification_radius_km?: number; // Pour le géofencing agents (défaut: 50km)
}

// Rôles nécessitant une vérification obligatoire
export const ROLES_REQUIRING_VERIFICATION: UserRole[] = ['coach', 'agent'];

// Helper: un utilisateur peut-il contacter des mineurs ?
export function canContactMinors(user: User): boolean {
  if (!ROLES_REQUIRING_VERIFICATION.includes(user.role)) return true;
  return user.is_verified;
}

// Helper: label badge de vérification
export function getVerificationBadge(user: User): {
  label: string;
  color: 'green' | 'orange' | 'red' | 'gray';
} {
  if (!ROLES_REQUIRING_VERIFICATION.includes(user.role)) {
    return { label: 'Joueur', color: 'gray' };
  }
  switch (user.verification_status) {
    case 'VERIFIED':
      return { label: 'Profil vérifié ✓', color: 'green' };
    case 'PENDING':
      return { label: 'Vérification en cours…', color: 'orange' };
    case 'REJECTED':
      return { label: 'Document rejeté', color: 'red' };
    default:
      return { label: 'Non vérifié', color: 'gray' };
  }
}
