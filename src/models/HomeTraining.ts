/**
 * Entraînement à domicile + coaching humain à l’heure.
 */

export type HomeExerciseMode = 'solo' | 'partner' | 'family';

export type HomeExerciseDifficulty = 'facile' | 'moyen' | 'difficile';

export type HomeExerciseFocus =
  | 'technique'
  | 'physique'
  | 'coordination'
  | 'vitesse'
  | 'finition'
  | 'gardien'
  | 'mental';

export interface HomeExercise {
  id: string;
  title: string;
  summary: string;
  modes: HomeExerciseMode[];
  /** Âge min / max (inclus). */
  age_min: number;
  age_max: number;
  positions: string[];
  focus: HomeExerciseFocus[];
  difficulty: HomeExerciseDifficulty;
  duration_min: number;
  reps_label: string;
  equipment: string[];
  instructions: string[];
  tips: string[];
  /** URL ou chemin média (optionnel). */
  demo_url?: string;
}

export type CoachSessionDurationMin = 30 | 60 | 90;

export type CoachSessionStatus =
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'paid'
  | 'completed'
  | 'cancelled';

export interface CoachHourlyProfile {
  coach_uid: string;
  display_name: string;
  photo_url?: string;
  bio?: string;
  specialties: string[];
  age_categories: string[];
  positions_coached: string[];
  city: string;
  /** Zone / rayon affiché (km). */
  radius_km?: number;
  hourly_rate_eur: number;
  club_id?: string;
  club_name?: string;
  sessions_completed: number;
  rating_avg?: number;
  available: boolean;
}

export interface CoachingCommissionSplit {
  /** Montant coach en € (sur le prix séance). */
  coach_eur: number;
  proday_eur: number;
  club_eur: number;
}

/** Config admin — commissions coaching à l’heure. */
export interface CoachingCommissionConfig {
  /** Commission ProDay en % du prix séance. */
  proday_percent: number;
  /** Commission club en % si le coach est rattaché (0 si indépendant). */
  club_percent: number;
  /** Fourchette tarif horaire coach (€). */
  hourly_rate_min_eur: number;
  hourly_rate_max_eur: number;
}

export const DEFAULT_COACHING_COMMISSION: CoachingCommissionConfig = {
  proday_percent: 10,
  club_percent: 7,
  hourly_rate_min_eur: 20,
  hourly_rate_max_eur: 60,
};

export interface CoachSessionBooking {
  id: string;
  coach_uid: string;
  coach_name: string;
  player_uid: string;
  player_name: string;
  club_id?: string;
  starts_at: Date;
  duration_min: CoachSessionDurationMin;
  price_eur: number;
  split: CoachingCommissionSplit;
  status: CoachSessionStatus;
  location_label?: string;
  notes?: string;
  report?: CoachSessionReport;
  created_at: Date;
  updated_at?: Date;
}

export interface CoachSessionReport {
  exercises_done: string;
  strengths: string;
  improvements: string;
  homework: string;
  homework_equipment: string[];
  next_goals: string;
  created_at: Date;
}

export function splitCoachingPayment(
  priceEur: number,
  config: CoachingCommissionConfig,
  hasClub: boolean,
): CoachingCommissionSplit {
  const proday = Math.round(((priceEur * config.proday_percent) / 100) * 100) / 100;
  const club = hasClub
    ? Math.round(((priceEur * config.club_percent) / 100) * 100) / 100
    : 0;
  const coach = Math.round((priceEur - proday - club) * 100) / 100;
  return { coach_eur: coach, proday_eur: proday, club_eur: club };
}

export const HOME_EXERCISE_MODE_LABELS: Record<HomeExerciseMode, string> = {
  solo: 'Tu peux réaliser cet exercice seul',
  partner: 'Tu as besoin d’un partenaire',
  family: 'Idéal avec un parent ou un frère / une sœur',
};

export const HOME_EXERCISE_DIFFICULTY_LABELS: Record<HomeExerciseDifficulty, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};
