/** SKU store — garder aligné avec `src/content/iapProducts.ts`. */
const IAP_SKUS: Record<string, Record<'monthly' | 'yearly', string>> = {
  club_pro: {
    monthly: 'com.proday.app.club_pro.monthly',
    yearly: 'com.proday.app.club_pro.yearly',
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
