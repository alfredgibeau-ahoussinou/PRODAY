import {
  ADMIN_HQ_MODES,
  ADMIN_GESTION_ATELIERS,
  adminHqRouteKey,
  hqRouteFromLegacyTab,
} from '../../navigation/adminTabConfig';
import {
  ADMIN_FOC_NAV,
  ADMIN_FOC_TABS,
  ADMIN_FOC_SCREEN_TABS,
  ADMIN_FOC_LEGACY_SECTION_MAP,
  resolveAdminFocNavigation,
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

  /* ── Football Operations Center (FOC) nav simplifié ── */

  it('ADMIN_FOC_NAV contient les 7 sections regroupées', () => {
    const sectionIds: AdminFocSectionId[] = ADMIN_FOC_NAV.map((n) => n.id);
    expect(sectionIds).toEqual([
      'dashboard',
      'personnes',
      'clubs',
      'competition',
      'operations',
      'finances',
      'plateforme',
    ]);
    expect(sectionIds).toHaveLength(7);
  });

  it('chaque section FOC a des sous-onglets dans ADMIN_FOC_TABS', () => {
    for (const section of ADMIN_FOC_NAV) {
      const tabs = ADMIN_FOC_TABS[section.id];
      expect(Array.isArray(tabs)).toBe(true);
      expect(tabs.length).toBeGreaterThan(0);
    }
  });

  it('ADMIN_FOC_TABS.personnes contient le tab à valider', () => {
    const tabs = ADMIN_FOC_TABS.personnes.map((t) => t.id);
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

  it('ADMIN_FOC_TABS.competition regroupe matchs et compétitions', () => {
    const tabs = ADMIN_FOC_TABS.competition.map((t) => t.id);
    expect(tabs).toEqual(['matchs', 'competitions']);
  });

  it('ADMIN_FOC_TABS.operations regroupe recrutement, communication et vidéo', () => {
    const tabs = ADMIN_FOC_TABS.operations.map((t) => t.id);
    expect(tabs).toEqual(['recrutement', 'communication', 'video']);
  });

  it('ADMIN_FOC_TABS.plateforme regroupe performance et paramètres', () => {
    const tabs = ADMIN_FOC_TABS.plateforme.map((t) => t.id);
    expect(tabs).toEqual(['performance', 'parametres']);
  });

  it('ADMIN_FOC_SCREEN_TABS.parametres contient personnaliser, audit et beta', () => {
    const tabs = ADMIN_FOC_SCREEN_TABS.parametres.map((t) => t.id);
    expect(tabs).toEqual(expect.arrayContaining(['personnaliser', 'systeme', 'audit', 'beta']));
  });

  it('ADMIN_FOC_SCREEN_TABS.communication contient question semaine', () => {
    const tabs = ADMIN_FOC_SCREEN_TABS.communication.map((t) => t.id);
    expect(tabs).toContain('questions');
  });

  it('mappe les anciens ids sidebar vers les sections regroupées', () => {
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.adherents).toBe('personnes');
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.matchs).toBe('competition');
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.communication).toBe('operations');
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.parametres).toBe('plateforme');
  });

  it('resolveAdminFocNavigation conserve l’onglet hub pour les liens legacy', () => {
    expect(resolveAdminFocNavigation('matchs')).toEqual({
      section: 'competition',
      hubTab: 'matchs',
    });
    expect(resolveAdminFocNavigation('communication')).toEqual({
      section: 'operations',
      hubTab: 'communication',
    });
    expect(resolveAdminFocNavigation('personnes')).toEqual({ section: 'personnes' });
  });
});
