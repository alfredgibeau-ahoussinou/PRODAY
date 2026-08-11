import {
  ADMIN_HQ_MODES,
  ADMIN_GESTION_ATELIERS,
  adminHqRouteKey,
  hqRouteFromLegacyTab,
} from '../../navigation/adminTabConfig';
import {
  ADMIN_FOC_NAV,
  ADMIN_FOC_TABS,
  type AdminFocSectionId,
} from '../../navigation/adminFocConfig';

describe('e2e. Navigation shell admin console', () => {
  /* ── Legacy HQ modes (bridge conservé) ── */

  it('expose exactement 5 modes', () => {
    expect(ADMIN_HQ_MODES.map((m) => m.id)).toEqual([
      'pilotage',
      'decisions',
      'gestion',
      'abonnements',
      'systeme',
    ]);
    expect(ADMIN_HQ_MODES.map((m) => m.label)).toEqual([
      'Pilotage',
      'Décisions',
      'Gestion',
      'Abonnements',
      'Système',
    ]);
  });

  it('gestion couvre les ateliers clés', () => {
    const ids = ADMIN_GESTION_ATELIERS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'comptes',
        'clubs',
        'publications',
        'fil',
        'messages',
        'devis',
        'matchs',
        'stages',
      ]),
    );
  });

  it('clés de route', () => {
    expect(adminHqRouteKey({ mode: 'decisions' })).toBe('decisions');
    expect(adminHqRouteKey({ mode: 'gestion', atelier: 'comptes' })).toBe('gestion:comptes');
    expect(adminHqRouteKey({ mode: 'abonnements' })).toBe('abonnements');
  });

  it('mappe les anciens onglets', () => {
    expect(hqRouteFromLegacyTab('pilotage')).toEqual({ mode: 'pilotage' });
    expect(hqRouteFromLegacyTab('inbox')).toEqual({ mode: 'decisions' });
    expect(hqRouteFromLegacyTab('users')).toEqual({
      mode: 'gestion',
      atelier: 'comptes',
    });
    expect(hqRouteFromLegacyTab('plateforme', 'sponsors')).toEqual({
      mode: 'gestion',
      atelier: 'devis',
    });
    expect(hqRouteFromLegacyTab('system')).toEqual({ mode: 'systeme' });
  });

  /* ── Football Operations Center (FOC) nav ── */

  it('ADMIN_FOC_NAV contient les 11 sections attendues', () => {
    const sectionIds: AdminFocSectionId[] = ADMIN_FOC_NAV.map((n) => n.id);
    expect(sectionIds).toEqual(
      expect.arrayContaining([
        'dashboard',
        'adherents',
        'clubs',
        'matchs',
        'competitions',
        'recrutement',
        'performance',
        'communication',
        'finances',
        'video',
        'parametres',
      ] as AdminFocSectionId[]),
    );
    expect(sectionIds).toHaveLength(11);
  });

  it('chaque section FOC a des sous-onglets dans ADMIN_FOC_TABS', () => {
    for (const section of ADMIN_FOC_NAV) {
      const tabs = ADMIN_FOC_TABS[section.id];
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs.length).toBeGreaterThan(0);
    }
  });

  it('ADMIN_FOC_TABS.adherents contient le tab à valider', () => {
    const tabs = ADMIN_FOC_TABS.adherents.map((t) => t.id);
    expect(tabs).toContain('decisions');
    expect(tabs).toEqual(
      expect.arrayContaining(['all', 'player', 'youth', 'teen', 'adult', 'decisions']),
    );
  });

  it('ADMIN_FOC_TABS.finances contient abonnements et paiements', () => {
    const tabs = ADMIN_FOC_TABS.finances.map((t) => t.id);
    expect(tabs).toContain('abonnements');
    expect(tabs).toContain('paiements');
  });

  it('ADMIN_FOC_TABS.parametres contient systeme, audit et beta', () => {
    const tabs = ADMIN_FOC_TABS.parametres.map((t) => t.id);
    expect(tabs).toEqual(expect.arrayContaining(['personnaliser', 'systeme', 'audit', 'beta']));
  });

  it('ADMIN_FOC_TABS.communication contient question semaine', () => {
    const tabs = ADMIN_FOC_TABS.communication.map((t) => t.id);
    expect(tabs).toContain('questions');
  });
});
