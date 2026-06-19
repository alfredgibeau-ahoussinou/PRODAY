import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { sendFcmToUser } from './messaging';

const db = admin.firestore();

const BATCH_LIMIT = 50;

type SponsorOfferDoc = {
  sponsor_uid?: string;
  company_name?: string;
  description?: string;
  city?: string;
  active?: boolean;
  geo_target_city?: string;
  geo_push_sent_at?: admin.firestore.Timestamp;
};

function normalizeCityLabel(city: string): string {
  return city.trim().toLowerCase();
}

function citiesMatch(userCity: string | undefined, offerCity: string): boolean {
  const target = normalizeCityLabel(offerCity);
  if (!target) return false;
  const user = normalizeCityLabel(String(userCity ?? ''));
  if (!user) return false;
  return user === target || user.includes(target) || target.includes(user);
}

function userAcceptsSponsorGeoPush(data: admin.firestore.DocumentData): boolean {
  if (data.is_active === false) return false;
  if (data.role === 'sponsor') return false;
  const prefs = data.notification_preferences as { sponsor_geo_opt_in?: boolean } | undefined;
  return prefs?.sponsor_geo_opt_in === true;
}

export async function notifySponsorOfferInCity(
  offerId: string,
  offer: SponsorOfferDoc,
  options?: { force?: boolean },
): Promise<{ recipients: number; pushes: number; skipped?: boolean }> {
  if (!offer.active) return { recipients: 0, pushes: 0, skipped: true };
  const city = String(offer.city ?? '').trim();
  if (!city) return { recipients: 0, pushes: 0, skipped: true };
  if (offer.geo_push_sent_at && !options?.force) {
    return { recipients: 0, pushes: 0, skipped: true };
  }

  const geoTarget = String(offer.geo_target_city ?? normalizeCityLabel(city));
  const sponsorUid = String(offer.sponsor_uid ?? '').trim();
  const company = String(offer.company_name ?? 'Un sponsor').trim() || 'Un sponsor';

  const usersSnap = await db
    .collection('users')
    .where('notification_preferences.sponsor_geo_opt_in', '==', true)
    .where('city', '==', city)
    .limit(BATCH_LIMIT * 2)
    .get();

  let recipients = 0;
  let pushes = 0;

  for (const userDoc of usersSnap.docs) {
    if (recipients >= BATCH_LIMIT) break;
    const data = userDoc.data();
    if (sponsorUid && userDoc.id === sponsorUid) continue;
    if (!userAcceptsSponsorGeoPush(data)) continue;
    if (!citiesMatch(data.city as string | undefined, city)) continue;

    recipients += 1;
    const sent = await sendFcmToUser(userDoc.id, {
      title: `Offre sponsor · ${city}`,
      body: `${company} propose une offre près de chez vous.`,
      data: {
        type: 'sponsor_offer',
        offerId,
        city: geoTarget,
      },
    });
    if (sent) pushes += 1;
  }

  await db.doc(`sponsor_offers/${offerId}`).set(
    {
      geo_target_city: geoTarget,
      geo_push_sent_at: admin.firestore.FieldValue.serverTimestamp(),
      geo_push_recipients: recipients,
      geo_push_delivered: pushes,
    },
    { merge: true },
  );

  console.log(`[notifySponsorOfferInCity] ${offerId} · ${city} → ${pushes}/${recipients} push`);
  return { recipients, pushes };
}

const firestoreTriggerOptions = {
  document: 'sponsor_offers/{offerId}',
  region: 'europe-west1',
} as const;

/** Nouvelle offre sponsor active → push aux joueurs opt-in dans la ville ciblée (Gen2, eur3 / europe-west1). */
export const onSponsorOfferCreated = onDocumentCreated(firestoreTriggerOptions, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const offer = snap.data() as SponsorOfferDoc;
  if (!offer.active) return;
  await notifySponsorOfferInCity(event.params.offerId, offer);
});

/** Réactivation d'une offre → push si pas encore envoyé (Gen2, eur3 / europe-west1). */
export const onSponsorOfferUpdated = onDocumentUpdated(firestoreTriggerOptions, async (event) => {
  const before = event.data?.before.data() as SponsorOfferDoc | undefined;
  const after = event.data?.after.data() as SponsorOfferDoc | undefined;
  if (!before || !after) return;
  const activated = !before.active && after.active;
  if (!activated) return;
  await notifySponsorOfferInCity(event.params.offerId, after);
});

/** Callable — relance manuelle après création côté client (propriétaire sponsor). */
export const notifySponsorOfferInCityCallable = onCall(
  { region: 'europe-west1' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Connexion requise');
    }

    const { offerId, force } = request.data as { offerId?: string; force?: boolean };
    if (!offerId?.trim()) {
      throw new HttpsError('invalid-argument', 'offerId requis');
    }

    const offerRef = db.doc(`sponsor_offers/${offerId.trim()}`);
    const offerSnap = await offerRef.get();
    if (!offerSnap.exists) {
      throw new HttpsError('not-found', 'Offre introuvable');
    }

    const offer = offerSnap.data() as SponsorOfferDoc;
    const sponsorUid = String(offer.sponsor_uid ?? '').trim();
    const isAdmin = request.auth.token?.admin === true;
    if (sponsorUid !== request.auth.uid && !isAdmin) {
      throw new HttpsError('permission-denied', 'Propriétaire sponsor requis');
    }

    return notifySponsorOfferInCity(offerSnap.id, offer, { force: !!force });
  },
);
