import {
  SPONSOR_NAV_ITEMS,
  SPONSOR_NAV_SECTIONS,
  isSponsorRouteActive,
  resolveSponsorPageMeta,
  sponsorRouteKey,
  type SponsorMainTabId,
} from '../../navigation/sponsorTabConfig';

describe('e2e — navigation shell sponsor', () => {
  const mainTabs: SponsorMainTabId[] = [
    'pilotage',
    'offres',
    'clubs',
    'reseau',
    'marque',
    'tarifs',
  ];

  it('expose un onglet principal par destination', () => {
    for (const tab of mainTabs) {
      expect(SPONSOR_NAV_ITEMS.some((item) => item.tab === tab)).toBe(true);
    }
  });

  it('résout les métadonnées pour chaque onglet', () => {
    for (const tab of mainTabs) {
      const meta = resolveSponsorPageMeta(tab);
      expect(meta.title.length).toBeGreaterThan(0);
      expect(meta.subtitle.length).toBeGreaterThan(0);
    }
  });

  it('segments réseau — messages et prospects', () => {
    expect(resolveSponsorPageMeta('reseau', 'messages').title).toBe('Messages');
    expect(resolveSponsorPageMeta('reseau', 'prospects').title).toBe('Prospects');
    expect(
      isSponsorRouteActive({ tab: 'reseau', segment: 'messages' }, 'reseau', 'messages'),
    ).toBe(true);
    expect(
      isSponsorRouteActive({ tab: 'reseau', segment: 'messages' }, 'reseau', 'prospects'),
    ).toBe(false);
  });

  it('clés de route stables pour le menu latéral', () => {
    expect(sponsorRouteKey({ tab: 'offres' })).toBe('offres');
    expect(sponsorRouteKey({ tab: 'reseau', segment: 'prospects' })).toBe('reseau:prospects');
  });

  it('sections de navigation couvrent tous les items', () => {
    const sectionIds = new Set(SPONSOR_NAV_SECTIONS.map((s) => s.id));
    for (const item of SPONSOR_NAV_ITEMS) {
      expect(sectionIds.has(item.section)).toBe(true);
    }
  });
});
