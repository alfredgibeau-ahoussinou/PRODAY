/** SKU store — garder aligné avec `src/content/iapProducts.ts`. */
const IAP_SKUS: Record<string, Record<'monthly' | 'yearly', string>> = {
  player_plus: {
    monthly: 'com.proday.app.player_plus.monthly',
    yearly: 'com.proday.app.player_plus.yearly',
  },
  recruiter_pro: {
    monthly: 'com.proday.app.recruiter_pro.monthly',
    yearly: 'com.proday.app.recruiter_pro.yearly',
  },
  coach_pro: {
    monthly: 'com.proday.app.coach_pro.monthly',
    yearly: 'com.proday.app.coach_pro.yearly',
  },
  club_pro: {
    monthly: 'com.proday.app.club_pro.monthly',
    yearly: 'com.proday.app.club_pro.yearly',
  },
  agent_elite: {
    monthly: 'com.proday.app.agent_elite.monthly',
    yearly: 'com.proday.app.agent_elite.yearly',
  },
  physio_pro: {
    monthly: 'com.proday.app.physio_pro.monthly',
    yearly: 'com.proday.app.physio_pro.yearly',
  },
  organizer_pro: {
    monthly: 'com.proday.app.organizer_pro.monthly',
    yearly: 'com.proday.app.organizer_pro.yearly',
  },
  sponsor_pro: {
    monthly: 'com.proday.app.sponsor_pro.monthly',
    yearly: 'com.proday.app.sponsor_pro.yearly',
  },
};

const SKU_TO_PLAN = new Map<string, string>();
for (const [planId, cycles] of Object.entries(IAP_SKUS)) {
  for (const sku of Object.values(cycles)) {
    SKU_TO_PLAN.set(sku, planId);
  }
}

export function isKnownIapSku(productId: string): boolean {
  return SKU_TO_PLAN.has(productId);
}

export function planIdForIapSku(productId: string): string | null {
  return SKU_TO_PLAN.get(productId) ?? null;
}
