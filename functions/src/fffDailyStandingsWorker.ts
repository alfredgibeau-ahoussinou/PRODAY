/**
 * PRODAY — SQUELETTE DE DOCUMENTS DE CLASSEMENTS (worker quotidien)
 *
 * CE WORKER NE SYNCHRONISE PLUS AUCUN CLASSEMENT.
 *
 * Historiquement il écrivait une date `lastSyncAt` « fraîche » en réutilisant
 * les lignes déjà stockées (voire un tableau vide) : c'était exactement le
 * comportement interdit — afficher des données anciennes comme fraîchement
 * synchronisées. Il ne crée désormais que **les documents manquants** pour
 * l'ensemble des championnats suivis, avec un état honnête :
 *   - `standings: []`, `source: 'empty'`, `syncStatus: 'fallback'`
 *   - `sync_health: 'unavailable'`, aucune `lastSyncAt` inventée
 *
 * La synchronisation réelle des classements est assurée toutes les 3 heures par
 * `scheduledFffStandingsSync` (voir `fffStandingsSync.ts` + docs/FFF_SYNC_3H.md).
 * Un document existant n'est JAMAIS modifié par ce worker.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { CERTIFIED_LEAGUE_META, certifiedFallback } from './fffStandingsCertifiedSeed';

export interface StandingsWorkerResult {
  leaguesProcessed: number;
  /** Nombre de documents squelettes créés (jamais de document existant touché). */
  documentsCreated: number;
  /** Nombre de documents déjà présents, laissés intacts. */
  existingPreserved: number;
  syncTimestamp: string;
  errors: string[];
}

const ALL_MANAGED_LEAGUE_IDS = Object.keys(CERTIFIED_LEAGUE_META);

/**
 * Crée les documents manquants de `fff_league_standings` avec un état honnête
 * (aucune donnée, aucune fausse fraîcheur). Ne touche jamais un document
 * existant, même vide : seul le sync 3 h en est propriétaire.
 */
export async function runDailyEnterpriseStandingsWorker(
  db: Firestore,
): Promise<StandingsWorkerResult> {
  const result: StandingsWorkerResult = {
    leaguesProcessed: 0,
    documentsCreated: 0,
    existingPreserved: 0,
    syncTimestamp: new Date().toISOString(),
    errors: [],
  };

  const colRef = db.collection('fff_league_standings');
  const currentSeason = '2026-2027';

  for (const leagueId of ALL_MANAGED_LEAGUE_IDS) {
    try {
      const fallback = certifiedFallback(leagueId, currentSeason);
      if (!fallback) continue;

      const docRef = colRef.doc(leagueId);
      const existingSnap = await docRef.get();
      if (existingSnap.exists) {
        // Propriété du sync 3 h : on ne réécrit ni les lignes ni les horodatages.
        result.existingPreserved += 1;
        result.leaguesProcessed += 1;
        continue;
      }

      await docRef.set({
        ...fallback,
        region: CERTIFIED_LEAGUE_META[leagueId]?.region ?? null,
        districtCode: CERTIFIED_LEAGUE_META[leagueId]?.districtCode ?? null,
        scorers: [],
        syncStatus: 'fallback',
        sync_health: 'unavailable',
        last_error: 'Aucune synchronisation réussie pour cette compétition.',
        officialFffCertified: false,
        next_sync_schedule: 'every 3 hours',
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });

      result.documentsCreated += 1;
      result.leaguesProcessed += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Ligue ${leagueId}: ${msg}`);
    }
  }

  return result;
}
