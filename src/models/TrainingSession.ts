/**
 * Modèle unifié : entraînement collectif (coach) + individuel (joueur).
 * Utilisé côté client + stocké en Firestore.
 */

export type TrainingSessionType = 'collective' | 'individual';

export type TrainingObjective =
  | 'technique'
  | 'physique'
  | 'tactique'
  | 'recuperation'
  | 'vitesse'
  | 'endurance'
  | 'frappe'
  | 'dribble'
  | 'passes'
  | 'heading'
  | 'pied_faible';

export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';

export type TrainingPhaseName = 'warmup' | 'exercises' | 'game' | 'cooldown';

export type TrainingGeneratedBy = 'coach' | 'ai' | 'player';

export interface TrainingExercise {
  name: string;
  description: string;
  duration_min?: number;
  reps?: number;
  sets?: number;
  rest_sec?: number;
  equipment?: string[];
  tips?: string[];
}

export interface TrainingPhase {
  name: TrainingPhaseName;
  label: string;
  duration_min: number;
  exercises: TrainingExercise[];
}

export interface TrainingSession {
  id: string;
  club_id?: string;
  team_id?: string;
  coach_uid?: string;
  player_uid?: string;
  type: TrainingSessionType;
  objective: TrainingObjective;
  duration_min: number;
  level: TrainingLevel;
  player_count?: number;
  phases: TrainingPhase[];
  generated_by: TrainingGeneratedBy;
  /** Paramètres de génération individuelle (joueur). */
  individual_params?: IndividualTrainingParams;
  created_at: Date;
}

export interface IndividualTrainingParams {
  position?: string;
  available_duration_min: number;
  equipment: string[];
  partner: boolean;
}

export interface GenerateCollectiveRequest {
  club_id: string;
  team_id?: string;
  objective: TrainingObjective;
  duration_min: number;
  level: TrainingLevel;
  player_count: number;
  coach_notes?: string;
}

export interface GenerateIndividualRequest {
  objective: TrainingObjective;
  position?: string;
  level: TrainingLevel;
  duration_min: number;
  equipment: string[];
  partner: boolean;
}

export const TRAINING_OBJECTIVE_LABELS: Record<TrainingObjective, string> = {
  technique: 'Technique',
  physique: 'Physique',
  tactique: 'Tactique',
  recuperation: 'Récupération',
  vitesse: 'Vitesse',
  endurance: 'Endurance',
  frappe: 'Frappe',
  dribble: 'Dribble',
  passes: 'Passes',
  heading: 'Jeu de tête',
  pied_faible: 'Pied faible',
};

export const COLLECTIVE_OBJECTIVES: TrainingObjective[] = [
  'technique',
  'physique',
  'tactique',
  'recuperation',
];

export const INDIVIDUAL_OBJECTIVES: TrainingObjective[] = [
  'pied_faible',
  'vitesse',
  'endurance',
  'frappe',
  'dribble',
  'passes',
  'heading',
  'technique',
  'physique',
];

export const TRAINING_LEVEL_LABELS: Record<TrainingLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
};

export const COLLECTIVE_DURATIONS = [60, 75, 90] as const;
export const INDIVIDUAL_DURATIONS = [15, 30, 45, 60] as const;

export const EQUIPMENT_OPTIONS = [
  'ballon',
  'cones',
  'echelle',
  'mur',
  'mini-but',
  'chasubles',
  'rien',
] as const;

export function totalSessionMinutes(session: TrainingSession): number {
  return session.phases.reduce((sum, p) => sum + p.duration_min, 0);
}

export function phaseLabel(name: TrainingPhaseName): string {
  const labels: Record<TrainingPhaseName, string> = {
    warmup: 'Échauffement',
    exercises: 'Exercices',
    game: 'Opposition',
    cooldown: 'Retour au calme',
  };
  return labels[name];
}
