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
  /** Rattachement officiel FFF de cette équipe pour la saison active. */
  fff_league_id?: string;
  fff_team_id?: string;
  fff_competition_id?: string;
  fff_district_code?: string;
  fff_division_label?: string;
  fff_group_label?: string;
  fff_season?: string;
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
  fff_league_id?: string;
  fff_team_id?: string;
  fff_competition_id?: string;
  fff_district_code?: string;
  fff_division_label?: string;
  fff_group_label?: string;
  fff_season?: string;
  is_default?: boolean;
}
