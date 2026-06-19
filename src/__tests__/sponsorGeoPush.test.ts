import {
  buildSponsorOfferPushPayload,
  citiesMatch,
  filterSponsorGeoRecipients,
  shouldSendSponsorGeoPush,
  userAcceptsSponsorGeoPush,
} from '../utils/sponsorGeoPush';

describe('sponsorGeoPush', () => {
  const offer = {
    id: 'offer-1',
    sponsor_uid: 'sponsor-1',
    company_name: 'SportCo',
    city: 'Lyon',
    active: true,
  };

  it('accepte uniquement les utilisateurs opt-in actifs non-sponsor', () => {
    expect(
      userAcceptsSponsorGeoPush({
        uid: 'u1',
        role: 'player',
        is_active: true,
        notification_preferences: { sponsor_geo_opt_in: true },
      }),
    ).toBe(true);
    expect(
      userAcceptsSponsorGeoPush({
        uid: 'u2',
        role: 'player',
        notification_preferences: { sponsor_geo_opt_in: false },
      }),
    ).toBe(false);
    expect(
      userAcceptsSponsorGeoPush({
        uid: 'u3',
        role: 'sponsor',
        notification_preferences: { sponsor_geo_opt_in: true },
      }),
    ).toBe(false);
  });

  it('matche les villes avec tolérance partielle', () => {
    expect(citiesMatch('Lyon', 'Lyon')).toBe(true);
    expect(citiesMatch('Lyon 3e', 'Lyon')).toBe(true);
    expect(citiesMatch('Marseille', 'Lyon')).toBe(false);
  });

  it('filtre le sponsor et respecte la limite batch', () => {
    const users = [
      {
        uid: 'sponsor-1',
        role: 'sponsor',
        city: 'Lyon',
        notification_preferences: { sponsor_geo_opt_in: true },
      },
      {
        uid: 'p1',
        role: 'player',
        city: 'Lyon',
        notification_preferences: { sponsor_geo_opt_in: true },
      },
      {
        uid: 'p2',
        role: 'player',
        city: 'Lyon 3e',
        notification_preferences: { sponsor_geo_opt_in: true },
      },
      {
        uid: 'p3',
        role: 'player',
        city: 'Paris',
        notification_preferences: { sponsor_geo_opt_in: true },
      },
    ];

    const recipients = filterSponsorGeoRecipients(users, offer, 10);
    expect(recipients.map((u) => u.uid)).toEqual(['p1', 'p2']);
  });

  it('ne renvoie pas si déjà envoyé', () => {
    expect(shouldSendSponsorGeoPush({ ...offer, geo_push_sent_at: new Date() })).toBe(false);
    expect(shouldSendSponsorGeoPush(offer)).toBe(true);
    expect(shouldSendSponsorGeoPush({ ...offer, active: false })).toBe(false);
  });

  it('construit un payload push sponsor_offer', () => {
    const payload = buildSponsorOfferPushPayload(offer);
    expect(payload.title).toContain('Offre sponsor');
    expect(payload.title).toContain('Lyon');
    expect(payload.data.type).toBe('sponsor_offer');
    expect(payload.data.offerId).toBe('offer-1');
  });
});
