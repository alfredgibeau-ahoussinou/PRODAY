/**
 * PRODAY — Schémas normalisés et types pour les adaptateurs de données FFF.
 *
 * Sépare strictement les adaptateurs sources des enregistrements internes ProDay :
 * - Classements officiels (Standings)
 * - Calendriers et résultats (Fixtures & Results)
 * - Registre des licenciés (Licensed-Player Records)
 * - Scores en direct et chronométrage (Live Scores)
 */

export type SourceType =
  | 'footclubs_export'
  | 'national_api_sports'
  | 'fff_dofa_live'
  | 'club_official_entry'
  | 'cached_snapshot'
  | 'empty_unconfigured';

export type SyncHealthStatus =
  | 'ok'
  | 'degraded'
  | 'stale'
  | 'error'
  | 'unavailable';

export interface SourceProvenance {
  source: SourceType;
  sourceLabel: string;
  externalId?: string;
  syncedAt: string; // ISO
  lastAttemptAt?: string;
  syncHealth: SyncHealthStatus;
  lastError?: string;
  isManualOverride?: boolean;
  overrideAuthor?: string;
  overrideReason?: string;
}

/**
 * 1. CLASSEMENTS NORMALISÉS
 */
export interface NormalizedStandingRow {
  rank: number;
  teamId: string;
  teamName: string;
  clubCode?: string; // N° affiliation FFF si disponible
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  penalties?: number;
  forfeits?: number;
  form: Array<'V' | 'N' | 'D'>;
  isMyTeam?: boolean;
}

export interface NormalizedStanding {
  id: string; // ex: 'ligue1', 'd1_d92'
  competitionName: string;
  season: string; // ex: '2026-2027'
  category: 'national' | 'regional' | 'district' | 'jeunes' | 'feminines';
  phase?: string; // ex: 'Poule Unique', 'Poule A', 'Phase 1'
  group?: string;
  region?: string;
  districtCode?: string;
  divisionLabel: string;
  standings: NormalizedStandingRow[];
  provenance: SourceProvenance;
}

/**
 * 2. CALENDRIERS ET RÉSULTATS NORMALISÉS
 */
export type NormalizedFixtureStatus =
  | 'scheduled'
  | 'postponed'
  | 'cancelled'
  | 'ongoing'
  | 'completed'
  | 'interrupted';

export interface NormalizedFixture {
  id: string; // Identifiant stable de la rencontre
  competitionId: string;
  competitionName: string;
  season: string;
  matchday: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  venue?: string;
  status: NormalizedFixtureStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  isResultConfirmed: boolean;
  correctionNotice?: string;
  provenance: SourceProvenance;
}

/**
 * 3. FICHES DE LICENCIÉS NORMALISÉES
 */
export type LicenseHolderStatus =
  | 'active_current_season'
  | 'renewal_pending'
  | 'transferred'
  | 'expired_unrenewed'
  | 'unverified';

export interface NormalizedLicenseRecord {
  licenseNumber: string; // Numéro de licence officiel FFF (ou TEMP-...)
  isOfficialLicense: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  birthDate?: string; // YYYY-MM-DD
  category: string; // ex: 'Seniors', 'U18', 'U15'
  clubAffiliationNumber: string;
  clubName: string;
  season: string; // ex: '2026-2027'
  status: LicenseHolderStatus;
  medicalCertificateValid: boolean;
  email?: string;
  phone?: string;
  rawFingerprint: string; // SHA-256 ou hash de la ligne pour idempotence
  matchedUserUid?: string;
  ambiguityFlag?: boolean;
  ambiguityReason?: string;
  provenance: SourceProvenance;
}

/**
 * 4. SCORES EN DIRECT ET CHRONOMÉTRAGE NORMALISÉS
 */
export interface NormalizedLiveScore {
  fixtureId: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'interrupted';
  hasLiveTelemetry: boolean; // Vrai si flux API officiel, Faux si match amateur
  minute?: number; // Chronomètre officiel uniquement si hasLiveTelemetry ou saisi manuellement
  clockRunning?: boolean;
  homeScore: number;
  awayScore: number;
  homeTeamName: string;
  awayTeamName: string;
  periodLabel?: string; // '1ère mi-temps', 'Mi-temps', '2ème mi-temps', 'Prolongations', 'Tirs au but'
  events: Array<{
    id: string;
    minute?: number;
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty_saved';
    team: 'home' | 'away';
    playerName?: string;
    detail?: string;
    timestamp: string; // ISO
  }>;
  sourceType: SourceType;
  verifiedByUid?: string; // Si saisie manuelle certifiée sur le banc
  lastUpdatedAt: string;
}
