import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  ADMIN_PRIMARY_NAV_IDS,
  ADMIN_MENU_DEST_IDS,
  isAdminNavSectionId,
  resolveAdminNav,
  resolveAdminCommandItems,
} from '../features/admin/navigation/adminNavConfig';
import { DEFAULT_PRICE_PER_MEMBER_EUR } from '../features/admin/utils/adminPricing';
import { computeProdayHealth } from '../utils/adminInsights';

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

describe('Cockpit Total navigation', () => {
  it('expose les 6 modules opérationnels', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'tour',
        'clubs',
        'identite',
        'effectifs',
        'classements',
        'utilisateurs',
      ]),
    );
    expect(ids).not.toContain('commercial');
    expect(ids).not.toContain('finances');
    expect(ids).not.toContain('ia');
    expect(ids).not.toContain('donnees');
    expect(ADMIN_NAV_GROUPS).toHaveLength(3);
    expect(ADMIN_PRIMARY_NAV_IDS).toHaveLength(5);
    expect(ADMIN_MENU_DEST_IDS).toEqual(expect.arrayContaining(['effectifs', 'classements']));
  });

  it('résout les legacy FOC vers le Cockpit', () => {
    expect(resolveAdminNav('dashboard').section).toBe('tour');
    expect(resolveAdminNav('accueil').section).toBe('tour');
    expect(resolveAdminNav('users').section).toBe('utilisateurs');
    expect(resolveAdminNav('business').section).toBe('tour');
    expect(resolveAdminNav('devis').section).toBe('tour');
    expect(resolveAdminNav('standings').section).toBe('classements');
    expect(resolveAdminNav('claims').section).toBe('identite');
    expect(isAdminNavSectionId('classements')).toBe(true);
    expect(isAdminNavSectionId('commercial')).toBe(false);
  });

  it('fournit des commandes palette cockpit', () => {
    const cmds = resolveAdminCommandItems();
    expect(cmds.some((c) => c.section === 'classements')).toBe(true);
    expect(cmds.some((c) => c.section === 'identite')).toBe(true);
    expect(cmds.some((c) => c.section === 'effectifs')).toBe(true);
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
