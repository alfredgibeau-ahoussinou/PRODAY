/** Stripe Checkout abonnements — actif en production ou via flag dev explicite. */
export function isStripeCheckoutEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_APP_ENV === 'production') return true;
  return process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED === '1';
}
