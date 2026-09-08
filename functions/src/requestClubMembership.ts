/**
 * Callable : demande d’adhésion joueur/coach → club (pending jusqu’à confirmation staff).
 * Crée un stub club ProDay si seul le n° FFF est connu (inscription avant claim club).
 */
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

type RequestInput = {
  club_id?: string | null;
  fff_affiliation_number?: string | null;
  player_name: string;
  role?: 'player' | 'coach' | 'parent';
  category?: string | null;
  license_number?: string | null;
  identity_document_name?: string | null;
  identity_document_url?: string | null;
  identity_document_type?: string | null;
  pre_registered_roster_id?: string | null;
};

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
}

export async function requestClubMembershipInFirestore(
  db: Firestore,
  uid: string,
  input: RequestInput,
): Promise<{ membership_id: string; club_id: string; status: 'pending' }> {
  const playerName = asString(input.player_name) || 'Membre';
  const role = input.role === 'coach' || input.role === 'parent' ? input.role : 'player';
  const fff = asString(input.fff_affiliation_number);
  let clubId = asString(input.club_id);

  if (!clubId && fff) {
    const byFff = await db
      .collection('clubs')
      .where('fff_affiliation_number', '==', fff)
      .limit(1)
      .get();
    if (!byFff.empty) {
      clubId = byFff.docs[0].id;
    } else {
      const dirSnap = await db.collection('fff_public_clubs').doc(fff).get();
      const dir = dirSnap.data() ?? {};
      const linked = asString(dir.proday_club_id);
      if (linked) {
        clubId = linked;
      } else {
        const name = asString(dir.name) || `Club FFF ${fff}`;
        const city = asString(dir.city);
        const department = asString(dir.department);
        const stubRef = db.collection('clubs').doc();
        await stubRef.set({
          name,
          city,
          department: department || null,
          location: { latitude: 0, longitude: 0 },
          verified: false,
          categories: [],
          sponsor_ids: [],
          owner_uid: '',
          fff_affiliation_number: fff,
          logo_url: asString(dir.logo_url) || null,
          is_active: true,
          unclaimed_stub: true,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });
        clubId = stubRef.id;
        await db
          .collection('fff_public_clubs')
          .doc(fff)
          .set(
            {
              proday_club_id: clubId,
              updated_at: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      }
    }
  }

  if (!clubId) {
    throw new Error('Club introuvable — sélectionnez un club FFF ou un espace ProDay.');
  }

  const existing = await db
    .collection('memberships')
    .where('player_uid', '==', uid)
    .where('club_id', '==', clubId)
    .limit(5)
    .get();
  for (const docSnap of existing.docs) {
    const st = asString(docSnap.data().status);
    if (st === 'active' || st === 'pending') {
      return { membership_id: docSnap.id, club_id: clubId, status: 'pending' };
    }
  }

  const memRef = db.collection('memberships').doc();
  await memRef.set({
    club_id: clubId,
    team_id: 'unassigned',
    player_uid: uid,
    player_name: playerName,
    role,
    category: asString(input.category) || null,
    license_number: asString(input.license_number) || null,
    identity_document_name: asString(input.identity_document_name) || null,
    identity_document_url: asString(input.identity_document_url) || null,
    identity_document_type: asString(input.identity_document_type) || null,
    pre_registered_roster_id: asString(input.pre_registered_roster_id) || null,
    fff_affiliation_number: fff || null,
    status: 'pending',
    requested_at: FieldValue.serverTimestamp(),
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  const clubSnap = await db.collection('clubs').doc(clubId).get();
  const ownerUid = asString(clubSnap.data()?.owner_uid);
  const roleLabel = role === 'coach' ? 'Coach' : role === 'parent' ? 'Parent' : 'Joueur';
  const title = "Demande d'adhésion";
  const body = `${playerName} (${roleLabel}) demande à rejoindre le club. Confirmez ou refusez.`;

  const recipientUids = new Set<string>();
  if (ownerUid) recipientUids.add(ownerUid);
  try {
    const staffSnap = await db
      .collection('users')
      .where('profile.club_id', '==', clubId)
      .limit(30)
      .get();
    for (const u of staffSnap.docs) {
      const r = asString(u.data().role);
      if (r === 'club' || r === 'coach' || r === 'admin') recipientUids.add(u.id);
    }
  } catch {
    // index manquant — owner seul
  }

  for (const recipient of recipientUids) {
    if (recipient === uid) continue;
    await db.collection('staff_notifications').add({
      recipient_uid: recipient,
      type: 'generic',
      title,
      body,
      club_id: clubId,
      player_uid: uid,
      membership_id: memRef.id,
      read_at: null,
      created_at: FieldValue.serverTimestamp(),
    });
  }

  return { membership_id: memRef.id, club_id: clubId, status: 'pending' };
}
