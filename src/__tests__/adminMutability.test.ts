import { normalizeClubPricing } from '../features/admin/utils/adminPricing';

describe('admin mutability helpers', () => {
  it('normalise les tarifs club', () => {
    expect(normalizeClubPricing({ min_per_member_eur: 2.5 }).min_per_member_eur).toBe(2.5);
    expect(normalizeClubPricing(null).standard_per_member_eur).toBe(3.5);
    expect(normalizeClubPricing({ promo_per_member_eur: -1 }).promo_per_member_eur).toBe(0);
  });
});
