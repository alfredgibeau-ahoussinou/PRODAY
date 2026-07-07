export type TeamGenderScope = 'men' | 'women' | 'mixed' | 'unspecified';

/** Équipe rattachée à un club (U17, Seniors, etc.). */
export interface Team {
  id: string;
  club_id: string;
  name: string;
  category?: string;
  gender_scope: TeamGenderScope;
  coach_uids: string[];
  season_id?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTeamInput {
  club_id: string;
  name: string;
  category?: string;
  gender_scope?: TeamGenderScope;
  coach_uids?: string[];
  season_id?: string;
  is_default?: boolean;
}
