export interface FederationClub {
  id: string;
  name: string;
  city: string;
  logoUrl?: string;
  fffNumber?: string;
  dofaId?: string;
  department?: string;
  region?: string;
  league?: string;
  postalCode?: string;
}

export type FederationCategory = 'Seniors' | 'Jeunes' | 'Féminines';

export interface FederationChampionship {
  id: string;
  clubId: string;
  name: string; // e.g. "CHAMPIONNAT NATIONAL U17"
  division: string; // e.g. "National", "R1", "D1"
  poule: string; // e.g. "Poule A", "Poule Unique"
  categoryTag: FederationCategory; // "Seniors" | "Jeunes" | "Féminines" for high-level filtering
  subCategory?: string; // e.g. "U17", "U18", "U15", "U14", "U13", "U11", "Vétérans", "Seniors", "Féminines"
  teamsAvailable: string[]; // e.g. ["Équipe 1", "Équipe 2"]
  teamNumber?: number; // e.g. 1
  competitionType?: 'CH' | 'CP' | 'AC';
  season?: number;
}

export interface FederationSyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress?: number; // 0-100
  lastSyncAt?: Date;
  errorMessage?: string;
  linkedFederationTeamId?: string;
}
