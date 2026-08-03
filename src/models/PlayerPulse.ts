export interface PlayerPulseEntry {
  uid: string;
  display_name: string;
  city?: string;
  level?: string;
  category?: string;
  club_id?: string;
  pulse_avg: number;
  matches_count: number;
  goals: number;
  assists: number;
  motm_count: number;
  updated_at: Date;
}

export interface UpsertPlayerPulseInput {
  uid: string;
  display_name: string;
  city?: string;
  level?: string;
  category?: string;
  club_id?: string;
  pulse_avg: number;
  matches_count: number;
  goals: number;
  assists: number;
  motm_count?: number;
}
