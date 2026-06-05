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
    expect(fullAnnualPrice(99.99)).toBe(1199.88);
    expect(yearlyPriceFromMonthly(99.99)).toBe(959.9);
    expect(annualSavingsFromMonthly(99.99)).toBe(239.98);
    expect(monthlyEquivalentFromYearly(959.9)).toBe(79.99);
  });

  it('calcule le pôle santé et l’organisateur', () => {
    expect(yearlyPriceFromMonthly(19.99)).toBe(191.9);
    expect(monthlyEquivalentFromYearly(191.9)).toBe(15.99);
    expect(yearlyPriceFromMonthly(14.99)).toBe(143.9);
  });
});
