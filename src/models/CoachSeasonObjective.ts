export type CoachObjectiveScope = 'team' | 'player';

/** Objectif de saison (équipe ou joueur). */
export interface CoachSeasonObjective {
  id: string;
  club_id: string;
  team_id?: string;
  scope: CoachObjectiveScope;
  player_uid?: string;
  player_name?: string;
  title: string;
  description?: string;
  /** 0–100 */
  progress: number;
  target_label?: string;
  season_label?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCoachSeasonObjectiveInput {
  club_id: string;
  team_id?: string;
  scope: CoachObjectiveScope;
  player_uid?: string;
  player_name?: string;
  title: string;
  description?: string;
  progress?: number;
  target_label?: string;
  season_label?: string;
}
