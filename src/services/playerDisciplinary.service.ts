// src/services/playerDisciplinary.service.ts
// Service centralisé de gestion des suspensions et d'éligibilité des joueurs ProDay (Footclubs FFF)

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  PlayerDisciplinaryRecord,
  DisciplinaryManualOverride,
  MatchEligibilityContext,
  PlayerEligibilityResult,
  PlayerEligibilityStatus,
  ClubDisciplinaryState,
} from '../models/PlayerDisciplinary';
import type { User } from '../models/User';
import {
  parseFootclubsDisciplineCsv,
  parseFrenchOrIsoDate,
} from '../features/club/utils/footclubsDisciplineParser';

const STORAGE_PREFIX_RECORDS = '@proday_disciplinary_records_';
const STORAGE_PREFIX_OVERRIDES = '@proday_disciplinary_overrides_';
const STORAGE_PREFIX_META = '@proday_disciplinary_meta_';

/** Seuil de péremption des données : 7 jours (les commissions FFF siègent et publient leurs PV chaque semaine) */
export const DISCIPLINARY_STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

class PlayerDisciplinaryService {
  /**
   * Importe et sauvegarde les données disciplinaires issues d'une extraction CSV Footclubs.
   */
  async importFootclubsCsv(
    clubId: string,
    csvContent: string
  ): Promise<{
    success: boolean;
    importedCount: number;
    errors: string[];
  }> {
    if (!clubId) {
      return { success: false, importedCount: 0, errors: ['Identifiant club manquant.'] };
    }

    const parseResult = parseFootclubsDisciplineCsv(csvContent, clubId);
    if (!parseResult.success && parseResult.records.length === 0) {
      return {
        success: false,
        importedCount: 0,
        errors: parseResult.errors.length > 0 ? parseResult.errors : ['Aucun enregistrement valide trouvé.'],
      };
    }

    // Charger les records existants pour fusionner / mettre à jour
    const existing = await this.listRecordsByClub(clubId);
    const existingMap = new Map<string, PlayerDisciplinaryRecord>();
    for (const rec of existing) {
      existingMap.set(rec.id, rec);
    }

    // Fusionner les nouveaux records
    for (const rec of parseResult.records) {
      // Si une sanction identique existe (même licence, pv_number), conserver l'historique des matchs purgés
      const existingMatch = Array.from(existingMap.values()).find(
        (r) => r.license_number === rec.license_number && r.pv_number === rec.pv_number
      );
      if (existingMatch) {
        existingMap.set(existingMatch.id, {
          ...rec,
          id: existingMatch.id,
          matches_served: Math.max(rec.matches_served, existingMatch.matches_served),
        });
      } else {
        existingMap.set(rec.id, rec);
      }
    }

    const merged = Array.from(existingMap.values());
    await AsyncStorage.setItem(`${STORAGE_PREFIX_RECORDS}${clubId}`, JSON.stringify(merged));

    // Mettre à jour les métadonnées de synchronisation
    const nowIso = new Date().toISOString();
    const meta: ClubDisciplinaryState = {
      club_id: clubId,
      last_import_at: nowIso,
      last_import_source: 'footclubs_csv',
      active_sanctions_count: merged.filter((r) => r.status === 'active').length,
      total_records_count: merged.length,
      overrides_count: (await this.listOverridesByClub(clubId)).length,
      is_stale: false,
    };
    await AsyncStorage.setItem(`${STORAGE_PREFIX_META}${clubId}`, JSON.stringify(meta));

    return {
      success: true,
      importedCount: parseResult.records.length,
      errors: parseResult.errors,
    };
  }

  /**
   * Enregistre manuellement une sanction issue d'un PV officiel de commission.
   */
  async addManualOfficialSanction(
    clubId: string,
    data: Omit<PlayerDisciplinaryRecord, 'id' | 'imported_at' | 'source' | 'club_id'>
  ): Promise<PlayerDisciplinaryRecord> {
    const existing = await this.listRecordsByClub(clubId);
    const nowIso = new Date().toISOString();
    const newRecord: PlayerDisciplinaryRecord = {
      ...data,
      id: `manual_pv_${data.license_number}_${Date.now()}`,
      club_id: clubId,
      source: 'official_pv_manual',
      imported_at: nowIso,
    };

    existing.unshift(newRecord);
    await AsyncStorage.setItem(`${STORAGE_PREFIX_RECORDS}${clubId}`, JSON.stringify(existing));

    // Mise à jour métadonnées
    await this.touchMeta(clubId);
    return newRecord;
  }

  /**
   * Liste l'ensemble des enregistrements disciplinaires du club.
   */
  async listRecordsByClub(clubId: string): Promise<PlayerDisciplinaryRecord[]> {
    if (!clubId) return [];
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX_RECORDS}${clubId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Récupère l'état disciplinaire du club (fraîcheur, dernière synchro).
   */
  async getClubDisciplinaryState(clubId: string): Promise<ClubDisciplinaryState> {
    if (!clubId) {
      return {
        club_id: clubId,
        active_sanctions_count: 0,
        total_records_count: 0,
        overrides_count: 0,
        is_stale: true,
      };
    }

    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX_META}${clubId}`);
      if (raw) {
        const meta: ClubDisciplinaryState = JSON.parse(raw);
        const lastSync = meta.last_import_at ? new Date(meta.last_import_at).getTime() : 0;
        const isStale = Date.now() - lastSync > DISCIPLINARY_STALE_THRESHOLD_MS;
        return {
          ...meta,
          is_stale: isStale,
        };
      }
    } catch {
      // fallback
    }

    // Si pas de meta mais qu'il y a des records
    const records = await this.listRecordsByClub(clubId);
    const overrides = await this.listOverridesByClub(clubId);
    return {
      club_id: clubId,
      active_sanctions_count: records.filter((r) => r.status === 'active').length,
      total_records_count: records.length,
      overrides_count: overrides.length,
      is_stale: records.length === 0,
    };
  }

  /**
   * Liste les overrides manuels enregistrés pour le club.
   */
  async listOverridesByClub(clubId: string): Promise<DisciplinaryManualOverride[]> {
    if (!clubId) return [];
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_PREFIX_OVERRIDES}${clubId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Enregistre un déblocage exceptionnel / override documenté (traçabilité dirigeant / coach).
   */
  async recordManualOverride(
    clubId: string,
    overrideData: Omit<DisciplinaryManualOverride, 'id' | 'created_at'>
  ): Promise<DisciplinaryManualOverride> {
    const overrides = await this.listOverridesByClub(clubId);
    const newOverride: DisciplinaryManualOverride = {
      ...overrideData,
      id: `override_${overrideData.license_number}_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    overrides.unshift(newOverride);
    await AsyncStorage.setItem(`${STORAGE_PREFIX_OVERRIDES}${clubId}`, JSON.stringify(overrides));
    return newOverride;
  }

  /**
   * Évalue l'éligibilité individuelle d'un joueur pour un match précis.
   */
  async evaluatePlayerEligibility(
    player: {
      uid: string;
      license_number?: string;
      display_name?: string;
      full_name?: string;
    },
    matchContext: MatchEligibilityContext,
    clubId: string
  ): Promise<PlayerEligibilityResult> {
    const playerName =
      player.display_name || player.full_name || `Joueur #${player.uid.slice(0, 5)}`;
    const licenseNumber = player.license_number?.trim();

    // Règle 1 : Absence de numéro de licence FFF -> vérification requise obligatoire
    if (!licenseNumber) {
      return {
        player_uid: player.uid,
        player_name: playerName,
        status: 'verification_required',
        summary: 'N° de licence FFF manquant',
        detailed_reason:
          'Ce joueur n’a pas de N° de licence FFF renseigné dans son profil. Impossible d’effectuer le rapprochement automatisé avec les PV de discipline.',
        is_overridden: false,
        source_label: 'Vérification manuelle requise',
        is_stale: true,
        blocking_for_official_sheet: true,
      };
    }

    // Récupérer l'état du club
    const clubState = await this.getClubDisciplinaryState(clubId);
    const records = await this.listRecordsByClub(clubId);

    // Règle 2 : Données manquantes ou obsolètes (> 7 jours)
    if (clubState.is_stale || records.length === 0) {
      return {
        player_uid: player.uid,
        player_name: playerName,
        license_number: licenseNumber,
        status: 'unavailable_or_outdated',
        summary: 'Données disciplinaires non synchronisées',
        detailed_reason:
          'Aucune extraction Footclubs récente (< 7 jours) n’a été chargée pour ce club. L’absence d’information ne constitue pas une confirmation d’éligibilité.',
        is_overridden: false,
        source_label: clubState.last_import_at
          ? `Dernier import : ${new Date(clubState.last_import_at).toLocaleDateString('fr-FR')}`
          : 'Aucun import Footclubs',
        last_sync_date: clubState.last_import_at,
        is_stale: true,
        blocking_for_official_sheet: true,
      };
    }

    // Règle 3 : Rapprochement strict par numéro de licence FFF
    const allPlayerRecords = records.filter(
      (r) => r.license_number.replace(/\s+/g, '') === licenseNumber.replace(/\s+/g, '')
    );
    const playerSanctions = allPlayerRecords.filter((r) => r.status === 'active');

    // Si aucune sanction active enregistrée pour cette licence
    if (playerSanctions.length === 0) {
      const hasServed = allPlayerRecords.some((r) => r.status === 'served');
      return {
        player_uid: player.uid,
        player_name: playerName,
        license_number: licenseNumber,
        status: 'clean',
        summary: hasServed
          ? 'Éligible (Sanctions antérieures purgées)'
          : 'Éligible (Aucune suspension active)',
        detailed_reason: hasServed
          ? 'Les sanctions antérieures enregistrées pour ce N° de licence ont été entièrement purgées.'
          : 'Aucune suspension n’a été identifiée pour ce N° de licence dans le dernier relevé disciplinaire Footclubs FFF.',
        is_overridden: false,
        source_label: `Footclubs (${new Date(clubState.last_import_at!).toLocaleDateString('fr-FR')})`,
        last_sync_date: clubState.last_import_at,
        is_stale: false,
        blocking_for_official_sheet: false,
      };
    }

    // Évaluation contextuelle de la sanction
    const matchDate =
      typeof matchContext.match_date === 'string'
        ? parseFrenchOrIsoDate(matchContext.match_date) || new Date()
        : matchContext.match_date;

    const isFriendly =
      matchContext.event_type === 'friendly' || matchContext.is_official === false;

    // Rechercher une sanction applicable
    for (const sanction of playerSanctions) {
      const effectiveDate = parseFrenchOrIsoDate(sanction.effective_date);

      // A) Règle de prise d'effet (le lundi suivant) :
      // Si la date du match est antérieure à la prise d'effet, le joueur peut jouer ce match
      if (effectiveDate && matchDate < effectiveDate) {
        continue;
      }

      // B) Cas du match amical :
      // Les matchs amicaux NE PURGENT PAS les suspensions de compétition officielle (Art. 226 FFF).
      // Si la sanction est spécifique aux compétitions officielles ('official_only', 'championship_only', 'cup_only'),
      // elle n'interdit pas de jouer un amical (sauf mention 'all_competitions').
      if (isFriendly) {
        if (sanction.scope !== 'all_competitions') {
          // En amical, éligible mais rappel que le match ne purgera pas la suspension officielle
          return {
            player_uid: player.uid,
            player_name: playerName,
            license_number: licenseNumber,
            status: 'clean',
            summary: 'Éligible pour amical (Ne purge pas)',
            detailed_reason: `Le joueur est sous le coup d'une suspension officielle (${sanction.matches_total - sanction.matches_served} match(s) restant(s)), mais le match amical est autorisé. Attention : ce match ne comptera pas dans la purge de sa suspension.`,
            active_sanction: sanction,
            is_overridden: false,
            source_label: sanction.commission_name,
            last_sync_date: clubState.last_import_at,
            is_stale: false,
            blocking_for_official_sheet: false,
          };
        }
      }

      // C) Sanction à temps ferme (plage de dates)
      if (sanction.sanction_type === 'time_fixed') {
        const startDate = sanction.start_date ? parseFrenchOrIsoDate(sanction.start_date) : effectiveDate;
        const endDate = sanction.end_date ? parseFrenchOrIsoDate(sanction.end_date) : null;

        if (startDate && matchDate >= startDate) {
          if (!endDate || matchDate <= endDate) {
            return this.buildSuspendedOrOverriddenResult(
              player.uid,
              playerName,
              licenseNumber,
              sanction,
              clubId,
              `Suspension à temps ferme en cours (du ${sanction.start_date || 'N/A'} au ${sanction.end_date || 'indéterminée'}) prononcée par ${sanction.commission_name} (${sanction.pv_number}).`
            );
          }
        }
      }

      // D) Sanction au nombre de matchs fermes
      if (
        sanction.sanction_type === 'matches_fixed' ||
        sanction.sanction_type === 'conditional'
      ) {
        const remainingMatches = sanction.matches_total - sanction.matches_served;
        if (remainingMatches > 0) {
          return this.buildSuspendedOrOverriddenResult(
            player.uid,
            playerName,
            licenseNumber,
            sanction,
            clubId,
            `Suspension de ${remainingMatches} match(s) ferme(s) non purgé(s) (décision ${sanction.pv_number} - ${sanction.commission_name}). Prise d'effet : ${sanction.effective_date}.`
          );
        }
      }
    }

    // Si toutes les sanctions sont futures ou purgées
    return {
      player_uid: player.uid,
      player_name: playerName,
      license_number: licenseNumber,
      status: 'clean',
      summary: 'Éligible (Sanctions antérieures purgées)',
      detailed_reason: 'Toutes les sanctions enregistrées sont purgées ou non applicables à ce match.',
      is_overridden: false,
      source_label: `Footclubs (${new Date(clubState.last_import_at!).toLocaleDateString('fr-FR')})`,
      last_sync_date: clubState.last_import_at,
      is_stale: false,
      blocking_for_official_sheet: false,
    };
  }

  /**
   * Vérifie si un override manuel existe et construit le résultat adapté.
   */
  private async buildSuspendedOrOverriddenResult(
    playerUid: string,
    playerName: string,
    licenseNumber: string,
    sanction: PlayerDisciplinaryRecord,
    clubId: string,
    suspendedDetails: string
  ): Promise<PlayerEligibilityResult> {
    const overrides = await this.listOverridesByClub(clubId);
    const existingOverride = overrides.find(
      (o) =>
        o.license_number.replace(/\s+/g, '') === licenseNumber.replace(/\s+/g, '') ||
        o.player_uid === playerUid
    );

    if (existingOverride) {
      return {
        player_uid: playerUid,
        player_name: playerName,
        license_number: licenseNumber,
        status: 'clean',
        summary: 'Éligible (Déblocage officiel documenté)',
        detailed_reason: `Suspension levée exceptionnellement par ${existingOverride.authorized_by_name}. Motif : "${existingOverride.reason}". Réf officielle : ${existingOverride.official_document_ref}.`,
        active_sanction: sanction,
        is_overridden: true,
        override_details: existingOverride,
        source_label: `Override: ${existingOverride.official_document_ref}`,
        is_stale: false,
        blocking_for_official_sheet: false,
      };
    }

    return {
      player_uid: playerUid,
      player_name: playerName,
      license_number: licenseNumber,
      status: 'suspended',
      summary: 'Joueur Suspendu',
      detailed_reason: suspendedDetails,
      active_sanction: sanction,
      is_overridden: false,
      source_label: `${sanction.commission_name} (${sanction.pv_number})`,
      is_stale: false,
      blocking_for_official_sheet: true,
    };
  }

  /**
   * Évalue l'éligibilité d'une composition d'équipe complète (feuille de match / convocation).
   */
  async evaluateLineupEligibility(
    lineupUids: string[],
    clubMembers: User[],
    matchContext: MatchEligibilityContext,
    clubId: string
  ): Promise<{
    results: PlayerEligibilityResult[];
    hasSuspended: boolean;
    hasVerificationRequired: boolean;
    hasOutdatedData: boolean;
    canSubmitOfficial: boolean;
    blockingPlayers: PlayerEligibilityResult[];
  }> {
    const results: PlayerEligibilityResult[] = [];
    const membersMap = new Map<string, User>();
    for (const m of clubMembers) {
      membersMap.set(m.uid, m);
    }

    for (const uid of lineupUids) {
      const member = membersMap.get(uid);
      const evalRes = await this.evaluatePlayerEligibility(
        {
          uid,
          license_number: member?.profile?.license_number,
          display_name: member?.display_name,
          full_name: member?.display_name,
        },
        matchContext,
        clubId
      );
      results.push(evalRes);
    }

    const blockingPlayers = results.filter((r) => r.blocking_for_official_sheet);
    const hasSuspended = results.some((r) => r.status === 'suspended');
    const hasVerificationRequired = results.some((r) => r.status === 'verification_required');
    const hasOutdatedData = results.some((r) => r.status === 'unavailable_or_outdated');

    // En match officiel, un joueur suspendu non overridé bloque strictement la validation officielle
    const isOfficialMatch = matchContext.event_type === 'competition' || matchContext.is_official === true;
    const canSubmitOfficial = isOfficialMatch ? !hasSuspended : true;

    return {
      results,
      hasSuspended,
      hasVerificationRequired,
      hasOutdatedData,
      canSubmitOfficial,
      blockingPlayers,
    };
  }

  /**
   * Enregistre la purge d'un match pour un joueur (après avoir disputé un match officiel valide).
   */
  async recordMatchServed(clubId: string, licenseNumber: string): Promise<boolean> {
    const records = await this.listRecordsByClub(clubId);
    let updated = false;

    const modified = records.map((r) => {
      if (
        r.license_number.replace(/\s+/g, '') === licenseNumber.replace(/\s+/g, '') &&
        r.status === 'active' &&
        r.sanction_type === 'matches_fixed'
      ) {
        const newServed = r.matches_served + 1;
        const isFinished = newServed >= r.matches_total;
        updated = true;
        return {
          ...r,
          matches_served: newServed,
          status: isFinished ? ('served' as const) : ('active' as const),
        };
      }
      return r;
    });

    if (updated) {
      await AsyncStorage.setItem(`${STORAGE_PREFIX_RECORDS}${clubId}`, JSON.stringify(modified));
      await this.touchMeta(clubId);
    }
    return updated;
  }

  private async touchMeta(clubId: string) {
    const records = await this.listRecordsByClub(clubId);
    const overrides = await this.listOverridesByClub(clubId);
    const meta: ClubDisciplinaryState = {
      club_id: clubId,
      last_import_at: new Date().toISOString(),
      last_import_source: 'official_pv_manual',
      active_sanctions_count: records.filter((r) => r.status === 'active').length,
      total_records_count: records.length,
      overrides_count: overrides.length,
      is_stale: false,
    };
    await AsyncStorage.setItem(`${STORAGE_PREFIX_META}${clubId}`, JSON.stringify(meta));
  }
}

export const playerDisciplinaryService = new PlayerDisciplinaryService();
