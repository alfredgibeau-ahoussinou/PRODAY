export type CoachSessionCheckoutReturn = {
  status: 'success' | 'cancel';
  bookingId?: string;
};

/** Parse l’URL de retour Stripe Checkout (`proday://coach-session?...`). */
export function parseCoachSessionCheckoutReturn(
  url: string,
): CoachSessionCheckoutReturn | null {
  if (!url.startsWith('proday://coach-session')) return null;
  const query = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const status = params.get('status');
  if (status !== 'success' && status !== 'cancel') return null;
  const bookingId = params.get('bookingId') ?? undefined;
  return { status, bookingId };
}
