/**
 * Modèle pour les programmes d'entraînement individuel assignés par le coach.
 */

import type { ExerciseDiagramData } from './ExerciseDiagram';

export type ProgramExerciseStatus = 'assigned' | 'completed_by_player' | 'verified_by_coach';

export interface AssignedExerciseSnapshot {
  id: string; // id de l'exercice ou sous-id
  library_exercise_id?: string;
  original_exercise_id?: string;
  title: string;
  instructions: string | string[];
  reps_label?: string;
  repetitions_or_duration?: string;
  duration_min?: number;
  equipment?: string[];
  diagram?: any; // snapshot du diagramme tactique/exercice
  player_completed: boolean;
  player_completed_at?: Date;
  player_feedback?: string;
  coach_reviewed: boolean;
  coach_reviewed_at?: Date;
  coach_feedback?: string;
}

export interface IndividualTrainingProgram {
  id: string;
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  coach_uid: string;
  coach_name: string;

  title: string;
  objective?: string;
  due_date?: Date;

  exercises: AssignedExerciseSnapshot[];

  // État global
  status: 'active' | 'completed' | 'archived';
  completed_by_player: boolean;
  player_notes?: string;
  reviewed_by_coach: boolean;
  coach_final_notes?: string;

  created_at: Date;
  updated_at: Date;
}

export interface CreateIndividualProgramInput {
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  coach_uid: string;
  coach_name: string;
  title: string;
  objective?: string;
  due_date?: Date;
  exercises: (Omit<AssignedExerciseSnapshot, 'player_completed' | 'coach_reviewed' | 'id'> & { id?: string })[];
}
