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

describe('Bureau Ops navigation', () => {
  it('expose les 6 zones workflow (pas Tour/Claims/Menu)', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids).toEqual([
      'pulse',
      'file',
      'annuaire',
      'comptes',
      'effectifs',
      'classements',
    ]);
    expect(ids).not.toContain('tour');
    expect(ids).not.toContain('identite');
    expect(ids).not.toContain('utilisateurs');
    expect(ids).not.toContain('menu');
    expect(ids).not.toContain('commercial');
    expect(ADMIN_NAV_GROUPS.map((g) => g.id)).toEqual(['desk', 'directory', 'live']);
    expect(ADMIN_RAIL_IDS).toHaveLength(6);
    expect(ADMIN_PRIMARY_NAV_IDS).toHaveLength(6);
    expect(ADMIN_MENU_DEST_IDS).toEqual([]);
    expect(adminChrome.dockRailHeight).toBe(0);
    expect(adminChrome.brandMark).toBe('BUREAU OPS');
  });

  it('résout les legacy FOC / Cockpit vers Bureau Ops', () => {
    expect(resolveAdminNav('dashboard').section).toBe('pulse');
    expect(resolveAdminNav('accueil').section).toBe('pulse');
    expect(resolveAdminNav('tour').section).toBe('pulse');
    expect(resolveAdminNav('users').section).toBe('comptes');
    expect(resolveAdminNav('business').section).toBe('pulse');
    expect(resolveAdminNav('devis').section).toBe('annuaire');
    expect(resolveAdminNav('standings').section).toBe('classements');
    expect(resolveAdminNav('claims').section).toBe('file');
    expect(resolveAdminNav('clubs').section).toBe('annuaire');
    expect(isAdminNavSectionId('classements')).toBe(true);
    expect(isAdminNavSectionId('file')).toBe(true);
    expect(isAdminNavSectionId('commercial')).toBe(false);
    expect(isAdminNavSectionId('menu')).toBe(false);
  });

  it('fournit des commandes palette ops réelles', () => {
    const cmds = resolveAdminCommandItems();
    expect(cmds.some((c) => c.section === 'classements')).toBe(true);
    expect(cmds.some((c) => c.section === 'file')).toBe(true);
    expect(cmds.some((c) => c.section === 'effectifs')).toBe(true);
    expect(cmds.some((c) => c.section === 'annuaire')).toBe(true);
    expect(cmds.some((c) => c.section === 'comptes')).toBe(true);
  });

  it('utilise un thème clair high-contrast (pas void graphite)', () => {
    expect(ADMIN_TOKENS.bg.toLowerCase()).not.toMatch(/^#0/);
    expect(ADMIN_TOKENS.foreground).toBe('#071525');
    expect(ADMIN_TOKENS.signal).toBe('#0D8A8A');
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
