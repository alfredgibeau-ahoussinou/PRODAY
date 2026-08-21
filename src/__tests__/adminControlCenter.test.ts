import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  ADMIN_PRIMARY_NAV_IDS,
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

describe('Admin Control Center navigation', () => {
  it('expose les domaines prioritaires', () => {
    const ids = ADMIN_NAV_ITEMS.map((n) => n.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'accueil',
        'plateforme',
        'utilisateurs',
        'clubs',
        'commercial',
        'finances',
        'ia',
        'systeme',
      ]),
    );
    expect(ADMIN_NAV_GROUPS.length).toBeGreaterThanOrEqual(4);
    expect(ADMIN_PRIMARY_NAV_IDS).toHaveLength(5);
  });

  it('résout les legacy FOC vers le nouveau nav', () => {
    expect(resolveAdminNav('dashboard').section).toBe('accueil');
    expect(resolveAdminNav('users').section).toBe('utilisateurs');
    expect(resolveAdminNav('business').section).toBe('finances');
    expect(resolveAdminNav('devis').section).toBe('commercial');
    expect(isAdminNavSectionId('commercial')).toBe(true);
  });

  it('fournit des commandes palette', () => {
    const cmds = resolveAdminCommandItems();
    expect(cmds.some((c) => c.section === 'commercial')).toBe(true);
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
    expect(h.score).toBe(100);
    expect(h.label).toBe('Excellent');
  });
});
