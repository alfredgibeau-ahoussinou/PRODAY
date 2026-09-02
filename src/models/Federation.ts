export interface FederationClub {
  id: string;
  name: string;
  logoUrl?: string;
  region?: string;
}

export interface FederationTeam {
  id: string;
  clubId: string;
  name: string;
  category: string; // e.g., "U16"
  division: string; // e.g., "D1"
  poule: string; // e.g., "Poule Unique"
  url?: string;
}

export interface FederationSyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress?: number; // 0-100
  lastSyncAt?: Date;
  errorMessage?: string;
  linkedFederationTeamId?: string;
}
