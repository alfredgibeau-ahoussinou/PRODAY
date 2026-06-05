/** Remise appliquée au paiement annuel (facturation 12 mois). */
export const ANNUAL_DISCOUNT_PERCENT = 20;

export function fullAnnualPrice(monthlyEur: number): number {
  return Math.round(monthlyEur * 12 * 100) / 100;
}

export function yearlyPriceFromMonthly(monthlyEur: number): number {
  return (
    Math.round(
      monthlyEur * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100) * 100,
    ) / 100
  );
}

export function monthlyEquivalentFromYearly(yearlyEur: number): number {
  return Math.round((yearlyEur / 12) * 100) / 100;
}

export function annualSavingsFromMonthly(monthlyEur: number): number {
  return (
    Math.round(
      (fullAnnualPrice(monthlyEur) - yearlyPriceFromMonthly(monthlyEur)) * 100,
    ) / 100
  );
}
