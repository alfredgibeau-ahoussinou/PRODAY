import {
  ADMIN_NAV,
  ADMIN_NAV_GROUPS,
  ADMIN_SCREEN_TABS,
  ADMIN_WORK_KIND_LABELS,
  adminSectionForWorkKind,
  adminSectionForSearchKind,
  type AdminSectionId,
} from '../../navigation/adminNavConfig';
import {
  canAccessSection,
  resolveAdminRole,
  ADMIN_ROLE_LABELS,
} from '../../utils/adminPermissions';

describe('e2e. Navigation shell admin console', () => {
  it('ADMIN_NAV contient les sections fonctionnelles Phase 1', () => {
    const ids = ADMIN_NAV.map((n) => n.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'accueil',
        'utilisateurs',
        'clubs',
        'coachs',
        'joueurs',
        'parents',
        'equipes',
        'matchs_events',
        'recrutement',
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
        'config_plateforme',
      ] as AdminSectionId[]),
    );
    expect(ids.length).toBeGreaterThanOrEqual(20);
  });

  it('regroupe Principal et Administration', () => {
    expect(ADMIN_NAV_GROUPS.map((g) => g.id)).toEqual(['principal', 'administration']);
    const adminItems = ADMIN_NAV.filter((n) => n.group === 'administration');
    expect(adminItems.map((n) => n.id)).toEqual(
      expect.arrayContaining(['audit', 'securite', 'config_plateforme']),
    );
  });

  it('chaque écran a des sous-onglets', () => {
    for (const key of Object.keys(ADMIN_SCREEN_TABS) as (keyof typeof ADMIN_SCREEN_TABS)[]) {
      expect(ADMIN_SCREEN_TABS[key].length).toBeGreaterThan(0);
    }
  });

  it('ADMIN_SCREEN_TABS.adherents contient le tab à valider', () => {
    const tabs = ADMIN_SCREEN_TABS.adherents.map((t) => t.id);
    expect(tabs).toContain('decisions');
  });

  it('ADMIN_SCREEN_TABS.finances contient boutique (marketplace)', () => {
    const tabs = ADMIN_SCREEN_TABS.finances.map((t) => t.id);
    expect(tabs).toContain('boutique');
    expect(tabs).toContain('abonnements');
  });

  it('mappe les kinds workQueue vers des sections menu', () => {
    expect(adminSectionForWorkKind('verification')).toBe('utilisateurs');
    expect(adminSectionForWorkKind('report')).toBe('signalements');
    expect(adminSectionForWorkKind('quote')).toBe('sponsors');
  });

  it('mappe la recherche globale vers des sections', () => {
    expect(adminSectionForSearchKind('user')).toBe('utilisateurs');
    expect(adminSectionForSearchKind('event')).toBe('matchs_events');
  });

  it('labels workQueue en français', () => {
    expect(ADMIN_WORK_KIND_LABELS.verification).toBe('Vérification');
    expect(ADMIN_WORK_KIND_LABELS.membership).toBe('Adhésion');
  });
});

describe('adminPermissions', () => {
  it('super_admin via email fondateur', () => {
    expect(resolveAdminRole('proday.admin@gmail.com')).toBe('super_admin');
  });

  it('modérateur limité aux sections modération', () => {
    expect(canAccessSection('moderateur', 'contenus')).toBe(true);
    expect(canAccessSection('moderateur', 'abonnements')).toBe(false);
  });

  it('admin_finance accède aux finances', () => {
    expect(canAccessSection('admin_finance', 'marketplace')).toBe(true);
    expect(canAccessSection('admin_finance', 'config_plateforme')).toBe(false);
  });

  it('expose les libellés de rôles', () => {
    expect(ADMIN_ROLE_LABELS.super_admin).toContain('Super');
  });
});
