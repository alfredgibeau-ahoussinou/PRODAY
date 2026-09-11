/**
 * PRODAY COMMERCIAL & INTEGRATION SYNERGY ENGINE
 * 
 * Module de synchronisation entre l'ingestion FFF et le modèle d'application ProDay :
 * Lorsqu'un club est créé ou réclamé ("claimed"), ses données FFF (ligue officielle,
 * catégories d'équipes, district) sont automatiquement liées et synchronisées.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { cleanFffText } from './fffEnterpriseIngestionEngine';

export interface SynergySyncResult {
  clubId: string;
  fffAffiliationNumber: string;
  assignedLeagueId: string;
  categoriesPopulated: string[];
  teamsCreatedCount: number;
  syncedAt: string;
}

const DEPT_TO_DEFAULT_LEAGUE: Record<string, string> = {
  '92': 'd1_d92',
  '93': 'd1_d93',
  '75': 'd1_d75',
  '94': 'd1_d94',
  '77': 'r1_idf_a',
  '78': 'r1_idf_a',
  '91': 'r1_idf_a',
  '95': 'r1_idf_a',
};

/**
 * Exécute la synergie d'intégration pour un club ProDay.
 */
export async function processClubIntegrationSynergy(
  db: Firestore,
  clubId: string,
  fffAffiliationNumber?: string,
): Promise<SynergySyncResult> {
  const clubRef = db.collection('clubs').doc(clubId);
  const clubSnap = await clubRef.get();

  if (!clubSnap.exists) {
    throw new Error(`Club ProDay introuvable: ${clubId}`);
  }

  const clubData = clubSnap.data() ?? {};
  const affiliation = (fffAffiliationNumber || clubData.fff_affiliation_number || '').toString().trim();
  const dept = (clubData.department || '92').toString().trim().replace(/^0+/, '');

  // 1. Détermination de la ligue prioritaire FFF
  const assignedLeagueId = clubData.fff_league_id || DEPT_TO_DEFAULT_LEAGUE[dept] || 'd1_d92';

  // 2. Recherche des données de structure harvestées
  let categories = Array.isArray(clubData.categories) ? clubData.categories : [];
  let teamsCreatedCount = 0;

  if (affiliation) {
    const structRef = db.collection('fff_club_structures').doc(affiliation);
    const structSnap = await structRef.get();
    if (structSnap.exists) {
      const structData = structSnap.data() ?? {};
      if (Array.isArray(structData.categories) && structData.categories.length > 0) {
        categories = Array.from(new Set([...categories, ...structData.categories]));
      }
      if (Array.isArray(structData.teams)) {
        teamsCreatedCount = structData.teams.length;
      }
    }
  }

  if (categories.length === 0) {
    categories = ['Seniors', 'U19', 'U17', 'U15'];
  }

  const nowStr = new Date().toISOString();

  // 3. Mise à jour atomique du club ProDay avec la synergie FFF
  await clubRef.set(
    {
      fff_affiliation_number: affiliation || clubData.fff_affiliation_number || null,
      fff_league_id: assignedLeagueId,
      name: cleanFffText(clubData.name),
      city: cleanFffText(clubData.city),
      categories,
      integration_synergy_synced_at: nowStr,
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    clubId,
    fffAffiliationNumber: affiliation,
    assignedLeagueId,
    categoriesPopulated: categories,
    teamsCreatedCount,
    syncedAt: nowStr,
  };
}
