import {
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_SECTIONS,
  adminRouteKey,
  isAdminRouteActive,
  resolveAdminPageMeta,
  type AdminMainTabId,
} from '../../navigation/adminTabConfig';

describe('e2e — navigation shell admin', () => {
  const mainTabs: AdminMainTabId[] = [
    'pilotage',
    'inbox',
    'users',
    'clubs',
    'moderation',
    'plateforme',
    'analytics',
    'system',
  ];

  it('expose les onglets principaux de la console', () => {
    for (const tab of mainTabs) {
      expect(ADMIN_NAV_ITEMS.some((item) => item.tab === tab)).toBe(true);
    }
  });

  it('résout les métadonnées gate et pilotage', () => {
    const pilotage = resolveAdminPageMeta('pilotage');
    expect(pilotage.title).toBe('Accueil');
    expect(pilotage.subtitle).toMatch(/Pilotage/i);
  });

  it('segments modération — reels et signalements', () => {
    expect(resolveAdminPageMeta('moderation', 'reels').title).toBe('Reels');
    expect(resolveAdminPageMeta('moderation', 'reports').title).toBe('Signalements');
    expect(
      isAdminRouteActive({ tab: 'moderation', segment: 'reels' }, 'moderation', 'reels'),
    ).toBe(true);
  });

  it('segment sponsors sous plateforme', () => {
    expect(resolveAdminPageMeta('plateforme', 'sponsors').title).toBe('Sponsors');
    expect(
      isAdminRouteActive({ tab: 'plateforme', segment: 'sponsors' }, 'plateforme', 'sponsors'),
    ).toBe(true);
  });

  it('clés de route pour le drawer admin', () => {
    expect(adminRouteKey({ tab: 'inbox' })).toBe('inbox');
    expect(adminRouteKey({ tab: 'plateforme', segment: 'mercato' })).toBe('plateforme:mercato');
  });

  it('sections couvrent la file inbox et la modération', () => {
    const inboxItem = ADMIN_NAV_ITEMS.find((i) => i.tab === 'inbox');
    expect(inboxItem?.section).toBe('overview');
    const reelsItem = ADMIN_NAV_ITEMS.find((i) => i.id === 'reels');
    expect(reelsItem?.section).toBe('moderation');
    const sectionIds = new Set(ADMIN_NAV_SECTIONS.map((s) => s.id));
    for (const item of ADMIN_NAV_ITEMS) {
      expect(sectionIds.has(item.section)).toBe(true);
    }
  });
});
