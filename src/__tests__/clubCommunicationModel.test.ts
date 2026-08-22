import {
  buildClubCommHubTiles,
  resolveClubCommSubtitle,
} from '../features/club/ui/clubCommunicationModel';

describe('clubCommunicationModel', () => {
  it('construit les tuiles hub vers destinations existantes', () => {
    const tiles = buildClubCommHubTiles({
      pendingMemberships: 2,
      unreadNotifications: 3,
    });
    expect(tiles.map((t) => t.id)).toEqual([
      'inbox',
      'notifications',
      'announce',
      'teams',
      'coaches',
      'players',
    ]);
    expect(tiles[0].primary).toBe(true);
    expect(tiles[1].hint).toContain('non lue');
    expect(tiles[5].hint).toContain('adhésion');
  });

  it('résume le sous-titre header sans jargon', () => {
    expect(
      resolveClubCommSubtitle({ pendingMemberships: 0, unreadNotifications: 0 }),
    ).toBe('Messagerie · notifications · annonces');
    expect(
      resolveClubCommSubtitle({ pendingMemberships: 1, unreadNotifications: 2 }),
    ).toContain('2 alertes');
  });
});
