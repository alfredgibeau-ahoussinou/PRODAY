/** Catalogue abonnements Pro pour Stripe Checkout — aligné sur src/content/subscriptionPlans.ts */

export type StripeSubPlanId =
  | 'player_plus'
  | 'recruiter_pro'
  | 'coach_pro'
  | 'club_amateur'
  | 'club_pro'
  | 'club_premium'
  | 'agent_elite'
  | 'physio_pro'
  | 'organizer_pro'
  | 'sponsor_pro';

export type StripeBillingCycle = 'monthly' | 'yearly';

const ANNUAL_DISCOUNT = 0.2;

function yearlyCentsFromMonthly(monthlyEur: number): number {
  return Math.round(monthlyEur * 12 * (1 - ANNUAL_DISCOUNT) * 100);
}

function monthlyCents(monthlyEur: number): number {
  return Math.round(monthlyEur * 100);
}

export const SUBSCRIPTION_STRIPE_CATALOG: Record<
  StripeSubPlanId,
  { label: string; monthlyEur: number; monthlyCents: number; yearlyCents: number }
> = {
  player_plus: {
    label: 'ProDay Pass Joueur Premium',
    monthlyEur: 3.99,
    monthlyCents: monthlyCents(3.99),
    yearlyCents: yearlyCentsFromMonthly(3.99),
  },
  recruiter_pro: {
    label: 'ProDay Recruteur Pro',
    monthlyEur: 7.99,
    monthlyCents: monthlyCents(7.99),
    yearlyCents: yearlyCentsFromMonthly(7.99),
  },
  coach_pro: {
    label: 'ProDay Coach Premium',
    monthlyEur: 7.99,
    monthlyCents: monthlyCents(7.99),
    yearlyCents: yearlyCentsFromMonthly(7.99),
  },
  club_amateur: {
    label: 'ProDay Club Amateur',
    monthlyEur: 4.99,
    monthlyCents: monthlyCents(4.99),
    yearlyCents: yearlyCentsFromMonthly(4.99),
  },
  club_pro: {
    label: 'ProDay Club Essentiel',
    monthlyEur: 11.99,
    monthlyCents: monthlyCents(11.99),
    yearlyCents: yearlyCentsFromMonthly(11.99),
  },
  club_premium: {
    label: 'ProDay Club Premium',
    monthlyEur: 39.99,
    monthlyCents: monthlyCents(39.99),
    yearlyCents: yearlyCentsFromMonthly(39.99),
  },
  agent_elite: {
    label: 'ProDay Agent Elite',
    monthlyEur: 29.99,
    monthlyCents: monthlyCents(29.99),
    yearlyCents: yearlyCentsFromMonthly(29.99),
  },
  physio_pro: {
    label: 'ProDay Physio Pro',
    monthlyEur: 19.99,
    monthlyCents: monthlyCents(19.99),
    yearlyCents: yearlyCentsFromMonthly(19.99),
  },
  organizer_pro: {
    label: 'ProDay Organisateur Pro',
    monthlyEur: 14.99,
    monthlyCents: monthlyCents(14.99),
    yearlyCents: yearlyCentsFromMonthly(14.99),
  },
  sponsor_pro: {
    label: 'ProDay Sponsor Pro',
    monthlyEur: 99,
    monthlyCents: monthlyCents(99),
    yearlyCents: yearlyCentsFromMonthly(99),
  },
};

export function isStripeSubPlanId(value: string): value is StripeSubPlanId {
  return Object.prototype.hasOwnProperty.call(SUBSCRIPTION_STRIPE_CATALOG, value);
}
