/** Unified match model — Supporter Space V3 (Sportmonks + ProDay). */

export type UnifiedMatchSource = 'proday' | 'external' | 'demo';

export type UnifiedMatchStatus =
  | 'scheduled'
  | 'live'
  | 'halftime'
  | 'finished'
  | 'postponed'
  | 'cancelled'
  | 'unknown';

export type GenderScope = 'men' | 'women' | 'youth' | 'mixed' | 'unknown';

export interface UnifiedTeamRef {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  country?: string;
  externalId?: number;
}

export interface UnifiedCompetitionRef {
  id: string;
  name: string;
  country?: string;
  logoUrl?: string;
  genderScope?: GenderScope;
  externalId?: number;
  seasonId?: number;
}

export interface UnifiedScore {
  home: number | null;
  away: number | null;
  /** Score à la mi-temps (description 1ST_HALF) — null si absent. */
  halfTimeHome?: number | null;
  halfTimeAway?: number | null;
  minute?: number | null;
  period?: string | null;
}

export interface UnifiedLineupPlayer {
  id: string;
  name: string;
  number?: number | null;
  position?: string | null;
  /** 1–11 starter order or formation slot */
  formationPosition?: number | null;
  /** Sportmonks `formation_field` row (1 = gardien → attaque). */
  pitchRow?: number | null;
  /** Sportmonks `formation_field` col within row (1-based). */
  pitchCol?: number | null;
  role: 'starter' | 'bench';
  photoUrl?: string | null;
  captain?: boolean;
  rating?: number | null;
  minutes?: number | null;
  goals?: number | null;
  shots?: number | null;
  /** Expected goals joueur (xglineup / details) — réel uniquement. */
  xg?: number | null;
}

export interface UnifiedLineupSide {
  teamId: string;
  formation?: string | null;
  players: UnifiedLineupPlayer[];
}

export interface UnifiedLineups {
  home: UnifiedLineupSide | null;
  away: UnifiedLineupSide | null;
}

export type UnifiedEventType =
  | 'goal'
  | 'own_goal'
  | 'penalty'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'var'
  | 'other';

export interface UnifiedMatchEvent {
  id: string;
  type: UnifiedEventType;
  minute: number | null;
  teamId?: string | null;
  playerName?: string | null;
  assistName?: string | null;
  detail?: string | null;
}

export interface UnifiedStatRow {
  key: string;
  label: string;
  home: number | string | null;
  away: number | string | null;
}

export interface UnifiedStatistics {
  rows: UnifiedStatRow[];
}

export interface UnifiedVideoRef {
  url: string;
  label?: string;
  rightsOk: boolean;
}

export interface UnifiedMatch {
  id: string;
  source: UnifiedMatchSource;
  homeTeam: UnifiedTeamRef;
  awayTeam: UnifiedTeamRef;
  competition: UnifiedCompetitionRef;
  date: Date;
  status: UnifiedMatchStatus;
  score: UnifiedScore;
  genderScope?: GenderScope;
  lineup?: UnifiedLineups | null;
  statistics?: UnifiedStatistics | null;
  events?: UnifiedMatchEvent[] | null;
  video?: UnifiedVideoRef | null;
  /** ProDay teamEvents id when source=proday */
  prodayEventId?: string;
  /** Sportmonks fixture id */
  externalFixtureId?: number;
  venue?: string | null;
}

export interface UnifiedStandingRow {
  position: number;
  team: UnifiedTeamRef;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface FixtureQuery {
  from?: string; // YYYY-MM-DD
  to?: string;
  liveOnly?: boolean;
  competitionIds?: string[];
  teamIds?: string[];
  genderScope?: GenderScope;
  status?: UnifiedMatchStatus | 'all';
}

export interface SearchResult {
  matches: UnifiedMatch[];
  teams: UnifiedTeamRef[];
  competitions: UnifiedCompetitionRef[];
}

export interface ProviderHealth {
  name: string;
  ready: boolean;
  mode: 'live' | 'demo' | 'empty';
  message?: string;
}
