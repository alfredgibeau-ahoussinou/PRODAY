// src/models/PlayerDisciplinary.ts
// Modèle officiel pour la gestion disciplinaire et les suspensions de joueurs (Footclubs FFF / Commissions)

import type { TeamEventType } from './TeamEvent';

/**
 * Périmètre de la sanction disciplinaire :
 * - 'all_competitions' : toutes compétitions (championnat, coupe, amicaux)
 * - 'official_only' : matchs officiels uniquement (championnats et coupes)
 * - 'championship_only' : championnat uniquement
 * - 'cup_only' : coupe uniquement
 */
export type DisciplinaryScope =
  | 'all_competitions'
  | 'official_only'
  | 'championship_only'
  | 'cup_only';

/**
 * Nature de la sanction :
 * - 'matches_fixed' : nombre déterminé de matchs fermes
 * - 'time_fixed' : période calendaire déterminée (date de début à date de fin)
 * - 'conditional' : suspension avec sursis
 */
export type SanctionType = 'matches_fixed' | 'time_fixed' | 'conditional';

/**
 * Statut de la sanction dans le temps.
 */
export type SanctionStatus = 'active' | 'served' | 'cancelled';

/**
 * Source de l'information disciplinaire.
 */
export type DisciplinaryDataSource =
  | 'footclubs_csv'
  | 'official_pv_manual';

/**
 * Enregistrement disciplinaire d'un joueur.
 */
export interface PlayerDisciplinaryRecord {
  id: string;
  /** N° de licence FFF (clé primaire de réconciliation, ex: '2541890123') */
  license_number: string;
  player_name: string;
  club_id: string;
  team_category?: string; // ex: 'Séniors', 'U19'
  /** Organisme disciplinaire (ex: 'Commission Régionale de Discipline - Ligue Paris Île-de-France') */
  commission_name: string;
  pv_number: string;
  /** Date de publication du PV officiel (format ISO AAAA-MM-JJ) */
  pv_date: string;
  /** Date légale de prise d'effet (ex: lundi suivant à 00:00 selon règle FFF) */
  effective_date: string;
  sanction_type: SanctionType;
  /** Nombre total de matchs fermes infligés */
  matches_total: number;
  /** Nombre de matchs déjà purgés */
  matches_served: number;
  /** Date de début de la suspension pour sanctions à temps ferme */
  start_date?: string;
  /** Date de fin de la suspension pour sanctions à temps ferme */
  end_date?: string;
  scope: DisciplinaryScope;
  status: SanctionStatus;
  source: DisciplinaryDataSource;
  imported_at: string;
  notes?: string;
  proof_url?: string;
}

/**
 * Enregistrement immuable d'un déblocage manuel exceptionnel par un dirigeant / coach.
 */
export interface DisciplinaryManualOverride {
  id: string;
  player_uid: string;
  license_number: string;
  match_id?: string;
  authorized_by_uid: string;
  authorized_by_name: string;
  reason: string;
  /** Référence du document officiel autorisant l'alignement (ex: 'PV N°42bis Commission d'Appel Ligue') */
  official_document_ref: string;
  created_at: string;
}

/**
 * Contexte du match pour évaluer l'éligibilité.
 */
export interface MatchEligibilityContext {
  match_id?: string;
  event_type: TeamEventType;
  /** Date du match (ISO string ou objet Date) */
  match_date: string | Date;
  team_category?: string;
  is_official?: boolean;
}

/**
 * Les 4 statuts stricts d'éligibilité requis par ProDay :
 * - 'suspended' : Joueur sous le coup d'une suspension applicable
 * - 'clean' : Vérifié sur une source officielle à jour et aucune sanction active applicable
 * - 'verification_required' : Données ambiguës, N° de licence manquant ou homonymie non résolue
 * - 'unavailable_or_outdated' : Données disciplinaires absentes ou non synchronisées depuis > 7 jours
 */
export type PlayerEligibilityStatus =
  | 'suspended'
  | 'clean'
  | 'verification_required'
  | 'unavailable_or_outdated';

/**
 * Résultat complet d'évaluation de l'éligibilité d'un joueur pour un match.
 */
export interface PlayerEligibilityResult {
  player_uid: string;
  player_name: string;
  license_number?: string;
  status: PlayerEligibilityStatus;
  summary: string;
  detailed_reason: string;
  active_sanction?: PlayerDisciplinaryRecord;
  is_overridden: boolean;
  override_details?: DisciplinaryManualOverride;
  source_label: string;
  last_sync_date?: string;
  is_stale: boolean;
  /** Indique si l'état bloque la soumission officielle de la feuille de match */
  blocking_for_official_sheet: boolean;
}

/**
 * Synthèse disciplinaire du club (état des imports et synchronisations).
 */
export interface ClubDisciplinaryState {
  club_id: string;
  last_import_at?: string;
  last_import_source?: DisciplinaryDataSource;
  active_sanctions_count: number;
  total_records_count: number;
  overrides_count: number;
  is_stale: boolean;
}
