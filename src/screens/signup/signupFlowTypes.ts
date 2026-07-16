/** Types et constantes partagés — sans logique métier (évite les cycles require). */

export type SignupPageId =
  | 'welcome'
  | 'space'
  | 'sport'
  | 'location'
  | 'stats'
  /** @deprecated — utiliser les pages *\_pro par rôle */
  | 'staff'
  | 'coach_pro'
  | 'club_pro'
  | 'agent_pro'
  | 'recruiter_pro'
  | 'organizer_pro'
  | 'medical_specialty'
  | 'medical_practice'
  | 'sponsor_pro'
  | 'sponsor_company'
  | 'sponsor_campaign'
  | 'sponsor_targeting'
  | 'family'
  | 'account'
  | 'security'
  | 'launch';

export type SignupFlowKind = 'player' | 'staff' | 'sponsor' | 'supporter';

export type SignupPhaseId = 'vous' | 'acces' | 'launch';

export interface SignupPhase {
  id: SignupPhaseId;
  label: string;
}

export const MEDICAL_POLE_SPECIALTIES = [
  'Kinésithérapeute du sport',
  'Ostéopathe',
  'Médecin du sport',
  'Préparateur physique',
  'Coach mental / préparateur mental',
  'Nutritionniste sportif',
  'Podologue du sport',
] as const;
