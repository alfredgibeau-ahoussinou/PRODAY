// src/models/User.ts
// Modèle principal utilisateur ProDay

import type { ParentalRuntime, ParentalSettings } from './ParentalSettings';
import type { AppSpaceId } from './AppSpace';
import type { ProductLineId } from './ProductLine';

export type PlayerVerificationCheckId = 'identity' | 'club_license' | 'parental_consent';
export type PlayerVerificationCheckStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'rejected';

export interface PlayerVerificationCheck {
  status: PlayerVerificationCheckStatus;
  document_id?: string;
  updated_at?: Date;
  rejection_reason?: string;
}

export interface PlayerVerificationState {
  identity: PlayerVerificationCheck;
  club_license: PlayerVerificationCheck;
  parental_consent?: PlayerVerificationCheck;
}

export type UserRole =
  | 'player'
  | 'coach'
  | 'club'
  | 'agent'
  | 'recruiter'
  | 'organizer'
  | 'sponsor'
  | 'supporter'
  | 'physio';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NOT_REQUIRED';

/**
 * Genre / segment — collecté à l'inscription (Amateur et Pro Joueur).
 * `minor` = mineur (interface jeunesse dédiée).
 */
export type Gender = 'men' | 'women' | 'minor';

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
  /** Genre déclaré à l'inscription — dimension, pas un pôle (cible doc architecture §1.4). */
  gender?: Gender;
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
  medical_specialty?: string; // Pôle médical (kiné du sport, ostéo, médecin...)
  specialties?: string[];
  /** Prise de RDV en ligne — pôle médical */
  booking_enabled?: boolean;
  consultation_duration_min?: number;
  weekly_availability?: {
    weekday: number;
    start: string;
    end: string;
  }[];
  experiences?: WorkExperience[];
  diplomas_list?: DiplomaRecord[];
  reviews?: ProfileReview[];
  rating?: number;            // moyenne 1–5
  
  // Commun
  bio?: string;
  /** Accroche affichée en tête du CV en ligne */
  cv_headline?: string;
  /** Objectifs sportifs / projet de carrière (CV en ligne) */
  cv_objectives?: string;
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

  /** Email confirmé via lien Firebase (comptes email/mot de passe) */
  email_verified?: boolean;

  /** Justificatifs d’onboarding envoyés (après validation email, avant dashboard) */
  onboarding_documents_submitted?: boolean;
  
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
  /** Préférences push — opt-in explicite offres sponsors locales + tribune supporter */
  notification_preferences?: {
    sponsor_geo_opt_in?: boolean;
    supporter?: {
      goalAlerts?: boolean;
      kickoffAlerts?: boolean;
      matchReminders?: boolean;
      communityDigest?: boolean;
    };
  };

  /** Contrôle parental (compte mineur / supervision famille) */
  parental_settings?: ParentalSettings;
  /** Temps d’écran du jour — sync locale → Firestore */
  parental_runtime?: ParentalRuntime;

  /** Espace ProDay : féminin, masculin, jeunes, -13 */
  app_space?: AppSpaceId;

  /** Version app à l'inscription (standard vs Woman) — ne change pas côté client */
  product_line?: ProductLineId;

  /** Abonnement plateforme (freemium store) */
  subscription_tier?: 'free' | 'pro';
  subscription_plan_id?: string;
  subscription_status?: 'active' | 'trialing' | 'canceled' | 'past_due';
  subscription_period_end?: Date;

  /** Formule sponsor commerciale (Territorial validé par admin — hors IAP) */
  sponsor_tier?: 'starter' | 'territorial' | 'national';
  sponsor_territorial_approved_at?: Date;
  /** Validation admin pour publication campagnes sponsor. */
  sponsor_approved?: boolean;

  /** Vérifications joueur (identité, licence club, etc.) */
  player_verification?: PlayerVerificationState;
}

// Rôles nécessitant une vérification obligatoire (document + revue IA / admin)
export const ROLES_REQUIRING_VERIFICATION: UserRole[] = [
  'coach',
  'club',
  'agent',
  'organizer',
];

export type VerificationDocumentType =
  | 'diploma'
  | 'license'
  | 'id'
  | 'authorization'
  | 'club_license';

export const PLAYER_VERIFICATION_CHECK_IDS: PlayerVerificationCheckId[] = [
  'identity',
  'club_license',
];

export function defaultPlayerVerificationState(
  isMinor: boolean
): PlayerVerificationState {
  return {
    identity: { status: 'not_submitted' },
    club_license: { status: 'not_submitted' },
    ...(isMinor ? { parental_consent: { status: 'not_submitted' } } : {}),
  };
}

export function verificationDocumentTypeForRole(role: UserRole): VerificationDocumentType {
  switch (role) {
    case 'agent':
      return 'license';
    case 'recruiter':
      return 'authorization';
    case 'organizer':
    case 'club':
      return 'authorization';
    case 'player':
      return 'id';
    case 'physio':
      return 'diploma';
    case 'coach':
    default:
      return 'diploma';
  }
}

export function documentTypeForPlayerCheck(
  checkId: PlayerVerificationCheckId
): VerificationDocumentType {
  if (checkId === 'club_license') return 'club_license';
  if (checkId === 'parental_consent') return 'id';
  return 'id';
}

/** Joueurs : identité obligatoire ; licence club pour badge complet */
export function computePlayerVerificationStatus(
  state: PlayerVerificationState | undefined
): VerificationStatus {
  if (!state) return 'NOT_REQUIRED';
  if (state.identity.status === 'rejected' || state.club_license.status === 'rejected') {
    return 'REJECTED';
  }
  if (state.identity.status === 'verified') {
    if (state.club_license.status === 'verified') return 'VERIFIED';
    if (state.club_license.status === 'pending') {
      return 'PENDING';
    }
    return 'VERIFIED';
  }
  if (
    state.identity.status === 'pending' ||
    state.club_license.status === 'pending'
  ) {
    return 'PENDING';
  }
  return 'PENDING';
}

export function playerVerificationProgress(state: PlayerVerificationState | undefined): {
  done: number;
  total: number;
  label: string;
} {
  if (!state) return { done: 0, total: 2, label: '0/2' };
  const checks = [state.identity, state.club_license];
  if (state.parental_consent) checks.push(state.parental_consent);
  const total = checks.length;
  const done = checks.filter((c) => c.status === 'verified').length;
  return { done, total, label: `${done}/${total}` };
}

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
  if (user.role === 'player' && user.player_verification) {
    const progress = playerVerificationProgress(user.player_verification);
    const status =
      user.verification_status === 'VERIFIED'
        ? 'VERIFIED'
        : computePlayerVerificationStatus(user.player_verification);
    if (status === 'VERIFIED' && progress.done >= progress.total) {
      return { label: `Joueur vérifié ${progress.label}`, color: 'green' };
    }
    if (status === 'REJECTED') return { label: 'Vérification refusée', color: 'red' };
    return { label: `Vérification ${progress.label}`, color: 'orange' };
  }
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
