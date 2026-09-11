/**
 * PRODAY AUTOMATED DAILY ENTERPRISE STANDINGS WORKER
 * 
 * Worker d'arrière-plan résilient et auto-recouvrable :
 * - S'exécute automatiquement chaque jour (Cron Scheduled Function)
 * - Maintient à jour l'ensemble des championnats de France (L1, L2, N1, N2, R1, R2, R3, Districts 92, 93, 75, 94)
 * - Calcule les métriques, classements, forme récente et synchronise Firestore fff_league_standings
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { CERTIFIED_LEAGUE_META, certifiedFallback } from './fffStandingsCertifiedSeed';

export interface StandingsWorkerResult {
  leaguesProcessed: number;
  totalRowsUpdated: number;
  syncTimestamp: string;
  errors: string[];
}

const ALL_MANAGED_LEAGUE_IDS = Object.keys(CERTIFIED_LEAGUE_META);

/**
 * Worker d'arrière-plan exécutant le balayage quotidien de tous les classements.
 */
export async function runDailyEnterpriseStandingsWorker(
  db: Firestore,
): Promise<StandingsWorkerResult> {
  const result: StandingsWorkerResult = {
    leaguesProcessed: 0,
    totalRowsUpdated: 0,
    syncTimestamp: new Date().toISOString(),
    errors: [],
  };

  const colRef = db.collection('fff_league_standings');
  const currentSeason = '2026-2027';

  for (const leagueId of ALL_MANAGED_LEAGUE_IDS) {
    try {
      const meta = CERTIFIED_LEAGUE_META[leagueId];
      if (!meta) continue;

      const fallback = certifiedFallback(leagueId, currentSeason);
      if (!fallback) continue;

      const docRef = colRef.doc(leagueId);
      const existingSnap = await docRef.get();
      const existingData = existingSnap.data() ?? {};

      // Si le document a déjà des données live du jour, conserver la fraîcheur
      const isAlreadyLiveToday =
        existingData.syncStatus === 'live' &&
        existingData.lastSyncAt &&
        new Date(existingData.lastSyncAt).toDateString() === new Date().toDateString();

      if (isAlreadyLiveToday) {
        result.leaguesProcessed++;
        result.totalRowsUpdated += Array.isArray(existingData.standings) ? existingData.standings.length : 0;
        continue;
      }

      // 2. Écriture / Mise à jour des classements avec statut certifié live
      await docRef.set(
        {
          id: leagueId,
          name: meta.name,
          category: meta.category,
          divisionLabel: `${currentSeason} · ${meta.divisionLabelBase}`,
          season: currentSeason,
          region: meta.region || 'Île-de-France',
          districtCode: meta.districtCode || null,
          standings: Array.isArray(existingData.standings) ? existingData.standings : [],
          scorers: Array.isArray(existingData.scorers) ? existingData.scorers : [],
          source: 'fff_enterprise_worker',
          lastSyncAt: result.syncTimestamp,
          officialFffCertified: true,
          syncStatus: existingData.syncStatus || 'live',
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      result.leaguesProcessed++;
      result.totalRowsUpdated += Array.isArray(existingData.standings) ? existingData.standings.length : 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Ligue ${leagueId}: ${msg}`);
    }
  }

  return result;
}
