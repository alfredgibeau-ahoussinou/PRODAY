/**
 * Annuaire public clubs foot français — données d’association uniquement (RGPD).
 * INTERDIT ici : présidents, téléphones, licenciés, toute donnée personnelle.
 */

export type PublicClubClaimStatus =
  | 'unclaimed'
  | 'claimed_pending'
  | 'verified'
  | 'activated';

export type PublicClubDirectorySource =
  | 'fff_dofa'
  | 'footclubs_structure'
  | 'proday_seed';

/** Document Firestore `fff_public_clubs/{fff_affiliation_number}` */
export interface PublicClubDirectoryEntry {
  /** = n° affiliation FFF (doc id) */
  fff_affiliation_number: string;
  dofa_id?: string;
  name: string;
  name_normalized: string;
  city: string;
  city_normalized: string;
  postal_code: string;
  department: string;
  region?: string;
  league?: string;
  /** Logo public s’il est déjà connu ProDay — jamais inventé */
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  /** Préfixes 2–4 chars pour array-contains Firestore */
  search_prefixes: string[];
  /** Concat normalisé name+city+cp+dept+fff pour filtre client */
  search_haystack: string;
  claim_status: PublicClubClaimStatus;
  /** Club ProDay lié (si claim / création) — pas d’UID claimer ici (PII) */
  proday_club_id?: string | null;
  source: PublicClubDirectorySource;
  created_at?: Date;
  updated_at?: Date;
}

/** Claim privé — `fff_public_club_claims/{fff_affiliation_number}` (pas de read public) */
export interface PublicClubClaimRecord {
  fff_affiliation_number: string;
  claimed_by_uid: string;
  status: Exclude<PublicClubClaimStatus, 'unclaimed'>;
  proday_club_id?: string | null;
  mandate_document_name?: string | null;
  claimed_at: Date;
  updated_at?: Date;
}

export const PUBLIC_CLUB_DIRECTORY_COLLECTION = 'fff_public_clubs';
export const PUBLIC_CLUB_CLAIMS_COLLECTION = 'fff_public_club_claims';
