import {
  ADMIN_HQ_MODES,
  ADMIN_GESTION_ATELIERS,
  ADMIN_WORK_KIND_LABELS,
  adminHqRouteKey,
  hqRouteFromLegacyTab,
} from '../../navigation/adminTabConfig';
import {
  ADMIN_FOC_NAV,
  ADMIN_FOC_TABS,
  ADMIN_FOC_SCREEN_TABS,
  ADMIN_FOC_LEGACY_SECTION_MAP,
  resolveAdminFocNavigation,
} from '../../navigation/adminFocConfig';
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  resolveAdminNav,
  isAdminNavSectionId,
} from '../../navigation/adminNavConfig';

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

  /* ── Nouveau menu groupé ── */

  it('ADMIN_NAV_ITEMS n’est plus le menu FOC 7 sections', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids).not.toEqual([
      'dashboard',
      'personnes',
      'clubs',
      'competition',
      'operations',
      'finances',
      'plateforme',
    ]);
    expect(ids).toEqual(
      expect.arrayContaining([
        'dashboard',
        'users',
        'clubs',
        'coaches',
        'players',
        'parents',
        'teams',
        'matchs',
        'recrutement',
        'ia',
        'video',
        'abonnements',
        'marketplace',
        'sponsors',
        'contenus',
        'messagerie',
        'signalements',
        'statistiques',
        'parametres',
        'audit',
        'securite',
        'config',
      ]),
    );
    expect(ids).toHaveLength(22);
  });

  it('le menu est groupé Principal / Administration', () => {
    expect(ADMIN_NAV_GROUPS.map((g) => g.id)).toEqual(['principal', 'administration']);
    expect(ADMIN_NAV_ITEMS.filter((n) => n.group === 'administration').map((n) => n.id)).toEqual([
      'audit',
      'securite',
      'config',
    ]);
  });

  it('ADMIN_FOC_NAV reflète le nouveau registre', () => {
    expect(ADMIN_FOC_NAV.map((n) => n.id)).toEqual(ADMIN_NAV_ITEMS.map((n) => n.id));
  });

  it('ADMIN_FOC_TABS.users / personnes conserve les filtres primaires', () => {
    const tabs = ADMIN_FOC_TABS.users.map((t) => t.id);
    expect(tabs).toEqual(['all', 'decisions', 'player', 'coach', 'parent', 'club']);
    expect(tabs).not.toContain('youth');
  });

  it('ADMIN_WORK_KIND_LABELS couvre membership et subscription_request', () => {
    expect(ADMIN_WORK_KIND_LABELS.membership).toBe('Adhésion');
    expect(ADMIN_WORK_KIND_LABELS.subscription_request).toBe('Abonnement');
  });

  it('ADMIN_FOC_TABS.abonnements / finances a Vue, Demandes, Comptes Pro', () => {
    const tabs = ADMIN_FOC_TABS.abonnements.map((t) => t.id);
    expect(tabs).toEqual(['vue', 'demandes', 'comptes', 'paiements', 'boutique', 'sponsors']);
    expect(ADMIN_FOC_TABS.finances.map((t) => t.id)).toEqual(tabs);
  });

  it('ADMIN_FOC_SCREEN_TABS.parametres contient personnaliser, audit et beta', () => {
    const tabs = ADMIN_FOC_SCREEN_TABS.parametres.map((t) => t.id);
    expect(tabs).toEqual(expect.arrayContaining(['personnaliser', 'systeme', 'audit', 'beta']));
  });

  it('ADMIN_FOC_SCREEN_TABS.communication contient question semaine', () => {
    const tabs = ADMIN_FOC_SCREEN_TABS.communication.map((t) => t.id);
    expect(tabs).toContain('questions');
  });

  it('mappe les anciens ids sidebar vers le nouveau menu', () => {
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.adherents).toBe('users');
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.matchs).toBe('matchs');
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.communication).toBe('contenus');
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.parametres).toBe('parametres');
    expect(ADMIN_FOC_LEGACY_SECTION_MAP.finances).toBe('abonnements');
  });

  it('resolveAdminFocNavigation ouvre les onglets profonds', () => {
    expect(resolveAdminFocNavigation('matchs')).toEqual({
      section: 'matchs',
      hubTab: 'matchs',
    });
    expect(resolveAdminFocNavigation('communication')).toEqual({ section: 'contenus' });
    expect(resolveAdminFocNavigation('users')).toEqual({ section: 'users' });
  });

  it('resolveAdminFocNavigation ouvre les onglets Personnes profonds', () => {
    expect(resolveAdminFocNavigation('adherents')).toEqual({
      section: 'users',
      screenTab: 'all',
    });
    expect(resolveAdminFocNavigation('coaches')).toEqual({
      section: 'coaches',
      screenTab: 'coach',
    });
    expect(resolveAdminFocNavigation('decisions')).toEqual({
      section: 'users',
      screenTab: 'decisions',
    });
  });

  it('resolveAdminFocNavigation ouvre Contenus pour publications', () => {
    expect(resolveAdminFocNavigation('publications')).toEqual({
      section: 'contenus',
      screenTab: 'fil',
    });
  });

  it('resolveAdminNav refuse les ids inconnus vers l’accueil', () => {
    expect(isAdminNavSectionId('dashboard')).toBe(true);
    expect(isAdminNavSectionId('personnes')).toBe(false);
    expect(resolveAdminNav('inconnu-xyz')).toEqual({ section: 'dashboard' });
  });
});
