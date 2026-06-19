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

  it('définit un email contact sponsors', () => {
    expect(SPONSOR_PARTNER_CONTACT_EMAIL).toContain('@');
  });

  it('aligne les formules sur le site (Découverte, Territorial, National Pro)', () => {
    const names = SPONSOR_PRICING_TIERS.map((t) => t.name);
    expect(names).toEqual(['Découverte', 'Territorial', 'National Pro']);
  });
});
