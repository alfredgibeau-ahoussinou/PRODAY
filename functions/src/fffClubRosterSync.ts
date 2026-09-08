/**
 * Sync quotidienne des effectifs FootClubs → cache `fff_club_rosters`
 * indexé par n° d’affiliation FFF (pour l’inscription).
 *
 * Impossible de scraper les licenciés FFF/DOFA (non publics / 401).
 * On republie uniquement les imports FootClubs / memberships déjà en base ProDay.
 */

import type { Firestore } from 'firebase-admin/firestore';

export interface FffRosterSyncResult {
  clubsScanned: number;
  rostersPublished: number;
  membersPublished: number;
  skippedNoAffiliation: number;
  errors: string[];
}

type MemberRow = {
  id: string;
  displayName: string;
  role: 'player' | 'coach';
  category: string;
  licenseNumber: string | null;
};

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
}

/**
 * Republie le cache signup pour chaque club ProDay ayant un n° d’affiliation FFF.
 */
export async function processFffClubRosterDailySync(db: Firestore): Promise<FffRosterSyncResult> {
  const result: FffRosterSyncResult = {
    clubsScanned: 0,
    rostersPublished: 0,
    membersPublished: 0,
    skippedNoAffiliation: 0,
    errors: [],
  };

  const clubsSnap = await db.collection('clubs').limit(500).get();
  result.clubsScanned = clubsSnap.size;

  for (const clubDoc of clubsSnap.docs) {
    const club = clubDoc.data();
    const affiliation = asString(club.fff_affiliation_number);
    if (!affiliation) {
      result.skippedNoAffiliation++;
      continue;
    }

    try {
      const memSnap = await db
        .collection('memberships')
        .where('club_id', '==', clubDoc.id)
        .limit(500)
        .get();

      const members: MemberRow[] = [];
      const seen = new Set<string>();

      for (const mDoc of memSnap.docs) {
        const m = mDoc.data();
        const name = asString(m.player_name);
        if (!name) continue;

        const source = asString(m.source);
        const license = asString(m.license_number);
        const uid = asString(m.player_uid);
        const status = asString(m.status);
        const isImport =
          source === 'footclubs_import' ||
          Boolean(m.pre_registered_roster_id) ||
          uid.startsWith('pre_') ||
          Boolean(license);

        // Uniquement données licence / import — pas les comptes « fantômes »
        if (!isImport && status !== 'active') continue;
        if (!isImport && !license) continue;

        const key = license || `${normalizeKey(name)}|${asString(m.category)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        members.push({
          id: mDoc.id,
          displayName: name,
          role: m.role === 'coach' ? 'coach' : 'player',
          category: asString(m.category),
          licenseNumber: license || null,
        });
      }

      await db
        .collection('fff_club_rosters')
        .doc(affiliation)
        .set(
          {
            affiliation_number: affiliation,
            club_name: asString(club.name) || 'Club FFF',
            proday_club_id: clubDoc.id,
            city: asString(club.city) || null,
            source: 'memberships_sync',
            synced_at: new Date().toISOString(),
            members,
            member_count: members.length,
            updated_at: new Date().toISOString(),
          },
          { merge: true }
        );

      result.rostersPublished++;
      result.membersPublished += members.length;
    } catch (e) {
      result.errors.push(
        `${clubDoc.id}/${affiliation}: ${e instanceof Error ? e.message : 'erreur'}`
      );
    }
  }

  return result;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 64);
}
