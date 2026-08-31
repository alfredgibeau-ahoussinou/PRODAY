import {
  buildSponsorNextActions,
  resolveSponsorHubSubtitle,
  sponsorNetworkEmptyCopy,
} from '../utils/sponsorHubModel';

describe('sponsorHubModel', () => {
  it('priorise messages non lus puis offres et prospects', () => {
    const actions = buildSponsorNextActions({
      approved: true,
      activeOffers: 2,
      prospectCount: 4,
      unreadMessages: 3,
      clubsSupported: 1,
      openGoals: 2,
    });
    expect(actions[0].id).toBe('open_messages');
    expect(actions[0].primary).toBe(true);
    expect(actions.map((a) => a.id)).toContain('view_offers');
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('oriente un sponsor non validé vers tarifs et prospects', () => {
    const actions = buildSponsorNextActions({
      approved: false,
      activeOffers: 0,
      prospectCount: 1,
      unreadMessages: 0,
      clubsSupported: 0,
    });
    expect(actions[0].id).toBe('await_approval');
    expect(actions.some((a) => a.id === 'contact_prospects')).toBe(true);
  });

  it('rédige un sous-titre hub clair', () => {
    expect(
      resolveSponsorHubSubtitle({
        approved: true,
        activeOffers: 0,
        prospectCount: 0,
        unreadMessages: 0,
        clubsSupported: 0,
      }),
    ).toContain('Publiez une offre');
    expect(
      resolveSponsorHubSubtitle({
        approved: true,
        activeOffers: 1,
        prospectCount: 0,
        unreadMessages: 2,
        clubsSupported: 0,
      }),
    ).toContain('2 messages');
  });

  it('fournit un empty réseau actionnable', () => {
    const empty = sponsorNetworkEmptyCopy('messages');
    expect(empty.primaryCta).toContain('prospects');
    expect(sponsorNetworkEmptyCopy('prospects').secondaryCta).toBeTruthy();
  });
});
