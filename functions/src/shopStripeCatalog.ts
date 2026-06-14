/** Prix Stripe (centimes) — source de vérité côté serveur. */
export const SHOP_STRIPE_PRODUCTS: Record<string, { name: string; priceCents: number }> = {
  'tripod-pro': { name: 'Trépied ProDay', priceCents: 3490 },
  'tripod-flex': { name: 'Mini-trépied flexible', priceCents: 1990 },
  'tee-classic': { name: 'T-shirt ProDay', priceCents: 2990 },
  'tee-training': { name: 'T-shirt training', priceCents: 3490 },
  'jersey-home': { name: 'Maillot domicile', priceCents: 5990 },
  'jersey-away': { name: 'Maillot extérieur', priceCents: 5990 },
};
