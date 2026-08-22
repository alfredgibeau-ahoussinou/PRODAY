import {
  buildClubHubAlerts,
  buildClubHubSettingsTiles,
  formatClubHubLocation,
  formatClubHubMetaLine,
  resolveClubHubBrandSourceLabel,
  resolveClubHubPackLabel,
  resolveClubHubSubtitle,
} from '../features/club/ui/clubHubModel';

describe('clubHubModel', () => {
  it('formate localisation et méta', () => {
    expect(formatClubHubLocation('Nantes', '44')).toBe('Nantes · 44');
    expect(formatClubHubLocation('', null)).toBe('');
    expect(formatClubHubMetaLine({ players: 2, coaches: 1, teams: 3 })).toBe(
      '2 joueurs · 1 coach · 3 équipes',
    );
  });

  it('résout pack, brand source et sous-titre', () => {
    expect(resolveClubHubPackLabel(undefined).title).toBe('SUR DEVIS');
    expect(resolveClubHubPackLabel('club_video_pro').title).toContain('Veo');
    expect(resolveClubHubBrandSourceLabel('logo')).toBe('Issues du logo');
    expect(resolveClubHubSubtitle({ city: 'Lyon', verified: true })).toContain(
      'vérifié',
    );
  });

  it('construit alertes et tuiles réglages', () => {
    const alerts = buildClubHubAlerts({
      teamsWithoutCoach: 2,
      pendingMemberships: 1,
    });
    expect(alerts.map((a) => a.id)).toEqual([
      'without_coach',
      'pending_memberships',
    ]);

    const tiles = buildClubHubSettingsTiles({
      hasPresident: true,
      packHint: 'SUR DEVIS',
    });
    expect(tiles[0].id).toBe('pack');
    expect(tiles.some((t) => t.id === 'president')).toBe(true);
    expect(tiles.some((t) => t.id === 'permissions')).toBe(true);
  });
});
