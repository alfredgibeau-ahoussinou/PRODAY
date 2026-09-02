export interface FederationClub {
  id: string;
  name: string;
  city: string;
  logoUrl?: string;
}

export type FederationCategory = 'Seniors' | 'Jeunes' | 'Féminines';

export interface FederationChampionship {
  id: string;
  clubId: string;
  name: string; // e.g. "U16"
  division: string; // e.g. "D1"
  poule: string; // e.g. "Poule Unique"
  categoryTag: FederationCategory;
  teamsAvailable: string[]; // e.g. ["Équipe 1", "Équipe 2"]
}

export interface FederationSyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress?: number; // 0-100
  lastSyncAt?: Date;
  errorMessage?: string;
  linkedFederationTeamId?: string;
}
