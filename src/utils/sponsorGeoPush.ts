/** Logique partagée — push géolocalisé offres sponsors (bêta). */

export const SPONSOR_GEO_PUSH_BATCH_LIMIT = 50;

export type SponsorGeoPushUser = {
  uid: string;
  role?: string;
  city?: string;
  is_active?: boolean;
  notification_preferences?: { sponsor_geo_opt_in?: boolean };
};

export type SponsorGeoOffer = {
  id: string;
  sponsor_uid?: string;
  company_name: string;
  city: string;
  description?: string;
  active?: boolean;
  geo_push_sent_at?: unknown;
};

export function normalizeCityLabel(city: string): string {
  return city.trim().toLowerCase();
}

export function citiesMatch(userCity: string | undefined, offerCity: string): boolean {
  const target = normalizeCityLabel(offerCity);
  if (!target) return false;
  const user = normalizeCityLabel(String(userCity ?? ''));
  if (!user) return false;
  return user === target || user.includes(target) || target.includes(user);
}

export function userAcceptsSponsorGeoPush(user: SponsorGeoPushUser): boolean {
  if (user.is_active === false) return false;
  if (user.role === 'sponsor') return false;
  return user.notification_preferences?.sponsor_geo_opt_in === true;
}

export function shouldSendSponsorGeoPush(
  offer: SponsorGeoOffer,
  options?: { force?: boolean; wasActive?: boolean },
): boolean {
  if (!offer.active) return false;
  const city = String(offer.city ?? '').trim();
  if (!city) return false;
  if (offer.geo_push_sent_at && !options?.force) return false;
  if (options?.wasActive === true && !options?.force) return false;
  return true;
}

export function filterSponsorGeoRecipients(
  users: SponsorGeoPushUser[],
  offer: Pick<SponsorGeoOffer, 'city' | 'sponsor_uid'>,
  limit = SPONSOR_GEO_PUSH_BATCH_LIMIT,
): SponsorGeoPushUser[] {
  const sponsorUid = String(offer.sponsor_uid ?? '').trim();
  const recipients: SponsorGeoPushUser[] = [];

  for (const user of users) {
    if (recipients.length >= limit) break;
    if (sponsorUid && user.uid === sponsorUid) continue;
    if (!userAcceptsSponsorGeoPush(user)) continue;
    if (!citiesMatch(user.city, offer.city)) continue;
    recipients.push(user);
  }

  return recipients;
}

export function buildSponsorOfferPushPayload(offer: Pick<SponsorGeoOffer, 'company_name' | 'city' | 'id'>) {
  const company = String(offer.company_name ?? 'Un sponsor').trim() || 'Un sponsor';
  const city = String(offer.city ?? '').trim();
  return {
    title: `Offre sponsor · ${city}`,
    body: `${company} propose une offre près de chez vous.`,
    data: {
      type: 'sponsor_offer',
      offerId: offer.id,
      city,
    },
  };
}
