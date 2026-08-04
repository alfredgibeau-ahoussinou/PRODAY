import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendFcmToUser } from './messaging';

const db = admin.firestore();

type Availability = 'available' | 'unavailable' | 'negotiating' | undefined;

function readAvailability(data: FirebaseFirestore.DocumentData | undefined): Availability {
  const value = data?.profile?.availability;
  if (value === 'available' || value === 'unavailable' || value === 'negotiating') {
    return value;
  }
  return undefined;
}

function availabilityLabel(value: Availability): string {
  switch (value) {
    case 'available':
      return 'disponible';
    case 'negotiating':
      return 'en négociation';
    case 'unavailable':
      return 'sous contrat';
    default:
      return 'mise à jour';
  }
}

/**
 * Shortlisted player availability change → push staff (Gen2, europe-west1 / Firestore eur3).
 */
export const onPlayerAvailabilityChanged = onDocumentUpdated(
  { document: 'users/{uid}', region: 'europe-west1' },
  async (event) => {
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;
    if (!beforeSnap || !afterSnap) return;

    const before = readAvailability(beforeSnap.data());
    const after = readAvailability(afterSnap.data());
    if (!after || before === after) return;

    const playerUid = String(event.params.uid);
    const playerName =
      (afterSnap.data()?.display_name as string | undefined)?.trim() || 'Un joueur';

    if (after !== 'available' && after !== 'negotiating') return;

    let shortlistSnap: FirebaseFirestore.QuerySnapshot;
    try {
      shortlistSnap = await db
        .collectionGroup('players')
        .where('player_uid', '==', playerUid)
        .limit(40)
        .get();
    } catch (e) {
      logger.warn('availability alert shortlist query failed', e);
      return;
    }

    if (shortlistSnap.empty) return;

    const staffUids = new Set<string>();
    for (const docSnap of shortlistSnap.docs) {
      const path = docSnap.ref.path;
      if (!path.startsWith('club_shortlists/')) continue;
      const staffUid = String(docSnap.data().staff_uid ?? '');
      if (staffUid && staffUid !== playerUid) staffUids.add(staffUid);
    }

    const title =
      after === 'available'
        ? 'Joueur shortlisté disponible'
        : 'Joueur shortlisté en discussion';
    const body = `${playerName} est maintenant ${availabilityLabel(after)}.`;

    await Promise.all(
      [...staffUids].map((staffUid) =>
        sendFcmToUser(staffUid, {
          title,
          body,
          data: {
            type: 'availability_alert',
            playerUid,
            availability: after,
          },
        })
      )
    );
  }
);
