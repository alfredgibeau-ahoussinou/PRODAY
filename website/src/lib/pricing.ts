/** Remise appliquée au paiement annuel (12 mois facturés d'un coup). */
export const ANNUAL_DISCOUNT_PERCENT = 20;

/** Tarif mensuel = prix de base. Annuel = base × 12 × (1 − remise). */
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

export function formatPriceEur(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/** Affichage court : tarif mensuel de base. */
export function formatMonthlyBasePrice(monthlyEur: number): string {
  return `${formatPriceEur(monthlyEur)} €/mois`;
}

/** Affichage court : tarif annuel avec remise. */
export function formatAnnualDiscountPrice(monthlyEur: number): string {
  return `${formatPriceEur(yearlyPriceFromMonthly(monthlyEur))} €/an (−${ANNUAL_DISCOUNT_PERCENT} %)`;
}

/** Ligne FAQ / texte : mensuel (base) + annuel (−20 %). */
export function formatAnnualPricingLine(monthlyEur: number): string {
  const yearly = yearlyPriceFromMonthly(monthlyEur);
  const equiv = monthlyEquivalentFromYearly(yearly);
  return `${formatMonthlyBasePrice(monthlyEur)} (tarif de base) ou ${formatPriceEur(yearly)} €/an (−${ANNUAL_DISCOUNT_PERCENT} %, soit ${formatPriceEur(equiv)} €/mois)`;
}

export interface PlanPricingDisplay {
  monthlyEur: number;
  yearlyEur: number;
  fullYearEur: number;
  savingsEur: number;
  monthlyEquivalentEur: number;
}

export function resolvePlanPricing(monthlyEur: number): PlanPricingDisplay {
  const yearlyEur = yearlyPriceFromMonthly(monthlyEur);
  return {
    monthlyEur,
    yearlyEur,
    fullYearEur: fullAnnualPrice(monthlyEur),
    savingsEur: annualSavingsFromMonthly(monthlyEur),
    monthlyEquivalentEur: monthlyEquivalentFromYearly(yearlyEur),
  };
}
