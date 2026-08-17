export type SubscriptionCheckoutReturn = {
  status: 'success' | 'cancel' | 'manage';
  planId?: string;
};

/** Parse l’URL de retour Stripe Checkout / Portal (`proday://subscription?...`). */
export function parseSubscriptionCheckoutReturn(
  url: string,
): SubscriptionCheckoutReturn | null {
  if (!url.startsWith('proday://subscription')) return null;
  const query = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const status = params.get('status');
  if (status !== 'success' && status !== 'cancel' && status !== 'manage') return null;
  const planId = params.get('planId') ?? undefined;
  return { status, planId };
}
