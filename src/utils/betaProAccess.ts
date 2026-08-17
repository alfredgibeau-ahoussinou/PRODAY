import { isStripeCheckoutEnabled } from './stripeSubscriptions';

/** Accès Pro via demande admin — actif hors production (bêta fermée), sauf si Stripe Checkout est activé. */
export function isBetaProRequestEnabled(): boolean {
  if (isStripeCheckoutEnabled()) return false;
  return process.env.EXPO_PUBLIC_APP_ENV !== 'production';
}
