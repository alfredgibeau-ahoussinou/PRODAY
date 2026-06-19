import {
  SPONSOR_PRICING_TIERS,
  SPONSOR_PARTNER_CONTACT_EMAIL,
} from '../content/sponsorPricing';

describe('sponsorPricing', () => {
  it('expose trois formules avec tarifs explicites', () => {
    expect(SPONSOR_PRICING_TIERS).toHaveLength(3);
    expect(SPONSOR_PRICING_TIERS[0]?.monthlyEur).toBe(0);
    expect(SPONSOR_PRICING_TIERS[1]?.monthlyEur).toBe(49);
    expect(SPONSOR_PRICING_TIERS[2]?.monthlyEur).toBe(99);
  });

  it('définit un email contact partenaires', () => {
    expect(SPONSOR_PARTNER_CONTACT_EMAIL).toContain('@');
  });
});
