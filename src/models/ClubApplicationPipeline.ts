/**
 * Pipeline candidatures club — suivi simplifié (kanban).
 * Remplace le flux PENDING/VIEWED/IN_PROGRESS opaque par des étapes actionnables.
 */

export type ClubApplicationStage =
  | 'inbox'
  | 'reviewing'
  | 'shortlist'
  | 'trial'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export type ClubApplicationPriority = 'low' | 'normal' | 'high';

/** Mapping depuis l'ancien statut Application (compat). */
export type LegacyApplicationStatus =
  | 'PENDING'
  | 'VIEWED'
  | 'IN_PROGRESS'
  | 'ACCEPTED'
  | 'REJECTED';

export interface ClubApplicationPipelineItem {
  id: string;
  post_id: string;
  club_id: string;
  player_uid: string;
  player_name?: string;
  stage: ClubApplicationStage;
  priority: ClubApplicationPriority;
  cover_letter?: string;
  notes?: string;
  trial_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export const CLUB_APPLICATION_STAGE_LABELS: Record<ClubApplicationStage, string> = {
  inbox: 'Observé',
  reviewing: 'Contacté',
  shortlist: 'Pré-sélection',
  trial: 'Essai',
  offer: 'Proposition',
  hired: 'Intégré',
  rejected: 'Refusé',
  withdrawn: 'Retiré',
};

/** Ordre d'affichage kanban (hors terminaux). */
export const CLUB_APPLICATION_ACTIVE_STAGES: ClubApplicationStage[] = [
  'inbox',
  'reviewing',
  'shortlist',
  'trial',
  'offer',
];

export const CLUB_APPLICATION_TERMINAL_STAGES: ClubApplicationStage[] = [
  'hired',
  'rejected',
  'withdrawn',
];

/**
 * Colonnes kanban amateur : Observé → Contacté → Essai → Intégré
 * (stages techniques regroupés pour une UI club simple).
 */
export const AMATEUR_RECRUITMENT_COLUMNS: {
  key: 'observed' | 'contacted' | 'trial' | 'integrated';
  label: string;
  stages: ClubApplicationStage[];
  advanceTo?: ClubApplicationStage;
}[] = [
  { key: 'observed', label: 'Observé', stages: ['inbox'], advanceTo: 'reviewing' },
  {
    key: 'contacted',
    label: 'Contacté',
    stages: ['reviewing', 'shortlist'],
    advanceTo: 'trial',
  },
  {
    key: 'trial',
    label: 'Essai',
    stages: ['trial', 'offer'],
    advanceTo: 'hired',
  },
  { key: 'integrated', label: 'Intégré', stages: ['hired'] },
];
