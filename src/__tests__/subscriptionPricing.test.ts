import {
  ANNUAL_DISCOUNT_PERCENT,
  annualSavingsFromMonthly,
  fullAnnualPrice,
  monthlyEquivalentFromYearly,
  yearlyPriceFromMonthly,
} from '../utils/subscriptionPricing';

describe('subscriptionPricing', () => {
  it('applique −20 % sur le total annuel', () => {
    expect(ANNUAL_DISCOUNT_PERCENT).toBe(20);
    // Agent Elite tarif standard (post-lancement)
    expect(fullAnnualPrice(29.99)).toBe(359.88);
    expect(yearlyPriceFromMonthly(29.99)).toBe(287.9);
    expect(annualSavingsFromMonthly(29.99)).toBe(71.98);
    expect(monthlyEquivalentFromYearly(287.9)).toBe(23.99);
  });

  it('calcule le pôle santé et l’organisateur', () => {
    expect(yearlyPriceFromMonthly(19.99)).toBe(191.9);
    expect(monthlyEquivalentFromYearly(191.9)).toBe(15.99);
    expect(yearlyPriceFromMonthly(14.99)).toBe(143.9);
  });
});
