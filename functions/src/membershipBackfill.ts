/**
 * Cloud Function — backfill serveur du profil à la validation d'une adhésion.
 *
 * Contexte (répétition d'acceptance, finding R-02) : les règles Firestore
 * interdisent à un staff club d'écrire `profile.club_id` d'un autre user
 * (anti auto-assignation), donc le `updateDoc` best-effort côté client de
 * `membershipsService.approve()` échoue silencieusement (`permission-denied`).
 * Conséquences mesurées : joueur/coach approuvés sans club → jamais convoqués
 * (invitee_uids résolu via `profile.club_id`), shell coach vide, coach non
 * éligible Smart Tactics.
 *
 * La seule voie fiable est serveur (Admin SDK, court-circuite les règles).
 * Déclencheur : toute transition → `status == 'active'` sur memberships.
 * Idempotent : champ `profile.membership_backfilled_at` sert de sentinelle ;
 * pas d'écrasement si l'utilisateur a déjà un club (changement de club passe
 * par un flux dédié, pas par ce backfill).
 *
 * La logique de décision est pure (`computeBackfillPatch`) et testée dans
 * functions/test/membershipBackfill.test.mjs — même convention que les
 * autres modules de fonctions.
 */
import * as functions from 'firebase-functions';
import { admin } from './firebaseAdmin';

const db = admin.firestore();

export type MembershipData = {
  player_uid?: string;
  club_id?: string;
  role?: string;
  category?: string | null;
};

export type UserData = {
  role?: string;
  profile?: {
    club_id?: string | null;
    membership_backfilled_at?: unknown;
    [key: string]: unknown;
  };
};

export type BackfillPatch = {
  role: string;
  profile: { club_id: string; membership_backfilled_at: typeof admin.firestore.FieldValue.serverTimestamp };
};

/**
 * Décide du patch à appliquer au profil après activation d'une adhésion.
 * Retourne null quand aucun backfill ne doit avoir lieu (idempotence,
 * clubs démo, club déjà présent différent, données manquantes).
 */
export function computeBackfillPatch(
  membership: MembershipData | null | undefined,
  user: UserData | null | undefined,
): BackfillPatch | null {
  const uid = membership?.player_uid;
  const clubId = membership?.club_id;
  if (!uid || !clubId) return null;
  if (clubId === 'demo-club' || clubId === 'club-demo') return null;
  if (!user) return null;

  const profile = user.profile ?? {};
  if (profile.membership_backfilled_at) return null; // déjà traité
  if (profile.club_id && profile.club_id !== clubId) return null; // club existant ≠ écrasement

  const requestedRole =
    membership.role === 'coach' ? 'coach' : membership.role === 'parent' ? 'parent' : 'player';
  const currentRole = user.role;
  // Un parent reste parent sauf si l'adhésion validée est un licencié joueur.
  const nextRole =
    requestedRole === 'parent' && currentRole && currentRole !== 'parent'
      ? currentRole
      : requestedRole;

  return {
    role: nextRole,
    profile: {
      club_id: clubId,
      membership_backfilled_at: admin.firestore.FieldValue.serverTimestamp() as never,
    },
  };
}

async function applyBackfill(
  membershipId: string,
  membership: MembershipData,
): Promise<void> {
  const userRef = db.collection('users').doc(membership.player_uid as string);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const patch = computeBackfillPatch(membership, userSnap.data() as UserData);
  if (!patch) return;
  await userRef.set(patch, { merge: true });
}

/** Transition → active sur memberships : backfill du profil licencié. */
export const onMembershipActivated = functions.firestore
  .document('memberships/{membershipId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before?.status === 'active') return; // déjà actif avant → rien à faire
    if (after.status !== 'active') return;
    await applyBackfill(change.after.id, after as MembershipData);
  });
