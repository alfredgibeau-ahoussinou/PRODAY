/**
 * Fiche d’essai numérique — confidentialité stricte, mineurs protégés.
 */

export type TrialSheetRatingKey =
  | 'technique'
  | 'game_understanding'
  | 'behavior'
  | 'intensity'
  | 'motor_skills'
  | 'perceived_potential';

export const TRIAL_SHEET_RATING_LABELS: Record<TrialSheetRatingKey, string> = {
  technique: 'Technique',
  game_understanding: 'Compréhension du jeu',
  behavior: 'Comportement',
  intensity: 'Intensité',
  motor_skills: 'Motricité',
  perceived_potential: 'Potentiel perçu',
};

export interface ClubTrialSheet {
  id: string;
  club_id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  position: string;
  target_team_label?: string;
  trial_date: Date;
  coach_uid: string;
  coach_name: string;
  ratings: Partial<Record<TrialSheetRatingKey, number>>;
  overall?: number | null;
  notes?: string;
  /** Mineur : consentement parent requis pour conservation. */
  is_minor: boolean;
  parental_consent_at?: Date | null;
  /** Accès réservé aux uids autorisés (staff). */
  authorized_uids: string[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateClubTrialSheetInput {
  club_id: string;
  first_name: string;
  last_name: string;
  birth_year: number;
  position: string;
  target_team_label?: string;
  trial_date: Date;
  coach_uid: string;
  coach_name: string;
  is_minor: boolean;
  authorized_uids: string[];
}

export function canViewTrialSheet(
  sheet: ClubTrialSheet,
  viewerUid: string,
  opts?: { isClubAdmin?: boolean },
): boolean {
  if (sheet.deleted_at) return false;
  if (opts?.isClubAdmin) return true;
  if (sheet.authorized_uids.includes(viewerUid)) return true;
  if (sheet.coach_uid === viewerUid) return true;
  return false;
}

export function trialSheetRequiresParentalConsent(sheet: ClubTrialSheet): boolean {
  return sheet.is_minor && !sheet.parental_consent_at;
}
