import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  ADMIN_PRIMARY_NAV_IDS,
  ADMIN_MENU_DEST_IDS,
  ADMIN_RAIL_IDS,
  isAdminNavSectionId,
  resolveAdminNav,
  resolveAdminCommandItems,
} from '../features/admin/navigation/adminNavConfig';
import { DEFAULT_PRICE_PER_MEMBER_EUR } from '../features/admin/utils/adminPricing';
import { computeProdayHealth } from '../utils/adminInsights';
import { ADMIN_TOKENS } from '../features/admin/theme/adminTokens';
import { adminChrome } from '../features/admin/theme/adminDesignSystem';

function quoteTotal(input: {
  membersCount: number;
  pricePerMember: number;
  discountPct?: number;
  optionsEur?: number;
}): number {
  const base = Math.max(0, input.membersCount) * Math.max(0, input.pricePerMember);
  const discount = Math.min(100, Math.max(0, input.discountPct ?? 0));
  const afterDiscount = base * (1 - discount / 100);
  return Math.round((afterDiscount + Math.max(0, input.optionsEur ?? 0)) * 100) / 100;
}

describe('Espace Admin navigation', () => {
  it('expose un menu exhaustif (pas 6 zones Pulse)', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids.length).toBeGreaterThanOrEqual(29);
    expect(ids).toContain('overview');
    expect(ids).toContain('users');
    expect(ids).toContain('user_create');
    expect(ids).toContain('memberships');
    expect(ids).toContain('verifications');
    expect(ids).toContain('sync');
    expect(ids).toContain('subscriptions');
    expect(ids).toContain('sponsor_quotes');
    expect(ids).not.toContain('tour');
    expect(ids).not.toContain('pulse');
    expect(ids).not.toContain('menu');
    expect(ADMIN_NAV_GROUPS.map((g) => g.id)).toEqual([
      'command',
      'people',
      'orgs',
      'fff',
      'business',
      'content',
      'platform',
    ]);
    expect(ADMIN_RAIL_IDS.length).toBe(ids.length);
    expect(ADMIN_PRIMARY_NAV_IDS.length).toBe(ids.length);
    expect(ADMIN_MENU_DEST_IDS).toEqual([]);
    expect(adminChrome.dockRailHeight).toBe(0);
    expect(adminChrome.sidebarCollapsed).toBe(0);
    expect(adminChrome.sidebarExpanded).toBeGreaterThanOrEqual(200);
    expect(adminChrome.brandMark).toBe('ESPACE ADMIN');
  });

  it('menu mobile = drawer labels (pas rail icônes)', () => {
    expect(adminChrome.sidebarCollapsed).toBe(0);
    expect(ADMIN_NAV_ITEMS.every((n) => n.label.trim().length > 0)).toBe(true);
    expect(ADMIN_NAV_GROUPS.length).toBeGreaterThanOrEqual(5);
  });

  it('résout les legacy FOC / Cockpit / Bureau Ops', () => {
    expect(resolveAdminNav('dashboard').section).toBe('overview');
    expect(resolveAdminNav('accueil').section).toBe('overview');
    expect(resolveAdminNav('tour').section).toBe('overview');
    expect(resolveAdminNav('pulse').section).toBe('overview');
    expect(resolveAdminNav('users').section).toBe('users');
    expect(resolveAdminNav('comptes').section).toBe('users');
    expect(resolveAdminNav('business').section).toBe('quotes');
    expect(resolveAdminNav('devis').section).toBe('quotes');
    expect(resolveAdminNav('sponsor_quotes').section).toBe('sponsor_quotes');
    expect(resolveAdminNav('standings').section).toBe('classements');
    expect(resolveAdminNav('claims').section).toBe('claims');
    expect(resolveAdminNav('clubs').section).toBe('clubs');
    expect(resolveAdminNav('file').section).toBe('queue');
    expect(isAdminNavSectionId('classements')).toBe(true);
    expect(isAdminNavSectionId('users')).toBe(true);
    expect(isAdminNavSectionId('commercial')).toBe(false);
    expect(isAdminNavSectionId('menu')).toBe(false);
    expect(isAdminNavSectionId('pulse')).toBe(false);
  });

  it('fournit des commandes palette ops réelles', () => {
    const cmds = resolveAdminCommandItems();
    expect(cmds.some((c) => c.section === 'classements')).toBe(true);
    expect(cmds.some((c) => c.section === 'claims')).toBe(true);
    expect(cmds.some((c) => c.section === 'effectifs')).toBe(true);
    expect(cmds.some((c) => c.section === 'clubs')).toBe(true);
    expect(cmds.some((c) => c.section === 'users')).toBe(true);
  });

  it('utilise un thème control room sombre premium', () => {
    expect(ADMIN_TOKENS.bg.toLowerCase()).toMatch(/^#0/);
    expect(ADMIN_TOKENS.foreground).toBe('#EEF1F5');
    expect(ADMIN_TOKENS.signal).toBe('#D4AF5F');
  });
});

describe('Admin pricing / devis', () => {
  it('calcule un total avec remise', () => {
    expect(
      quoteTotal({
        membersCount: 100,
        pricePerMember: DEFAULT_PRICE_PER_MEMBER_EUR,
        discountPct: 10,
        optionsEur: 50,
      }),
    ).toBe(320);
  });
});

describe('ProDay Health', () => {
  it('retourne un score borné', () => {
    const h = computeProdayHealth({
      stats: {
        users: 10,
        players: 8,
        coaches: 1,
        agents: 0,
        clubs: 2,
        teamEvents: 0,
        friendlyMatches: 0,
        recruitmentPosts: 0,
        paymentRequests: 0,
        applications: 0,
        announcements: 0,
        pendingVerifications: 0,
        pendingCommunityReels: 0,
        reelReports: 0,
        pendingPayments: 0,
      },
      workCount: 0,
      pendingPayments: 0,
    });
    expect(h.score).toBeGreaterThanOrEqual(0);
    expect(h.score).toBeLessThanOrEqual(100);
  });
});
