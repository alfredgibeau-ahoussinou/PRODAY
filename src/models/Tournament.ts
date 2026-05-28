import type { GeoPoint } from './User';

export type TournamentStatus = 'OPEN' | 'IN_PROGRESS' | 'FINISHED';

export interface Tournament {
  id: string;
  name: string;
  organizer_id: string;
  location: GeoPoint;
  city: string;
  date_start: Date;
  date_end: Date;
  categories: string[];
  status: TournamentStatus;
  subscriber_uids: string[];
  awards?: TournamentAwards;
  awards_names?: {
    best_player?: string;
    top_scorer?: string;
    best_goalkeeper?: string;
  };
}

export interface TournamentAwards {
  best_player_uid: string;
  top_scorer_uid: string;
  best_goalkeeper_uid: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  team_a_name: string;
  team_b_name: string;
  score_a: number;
  score_b: number;
  phase: 'poule' | 'elimination';
  scheduled_at?: Date;
  played: boolean;
}

/** @deprecated Utiliser TournamentMatch */
export interface Match {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  score_a: number;
  score_b: number;
  phase: 'poule' | 'quart' | 'demi' | 'finale';
  played_at?: Date;
}
