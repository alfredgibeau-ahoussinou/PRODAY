import { callFunction } from '../lib/firebaseFunctions';

/**
 * Démarre un Checkout Stripe pour une inscription événement payante.
 * Deep link retour : proday://events?status=...&registrationId=...
 */
export async function startEventRegistrationCheckout(
  eventId: string,
  registrationId: string,
): Promise<{ url: string; sessionId: string }> {
  return callFunction<
    { eventId: string; registrationId: string },
    { url: string; sessionId: string }
  >('createEventRegistrationCheckoutSession', { eventId, registrationId });
}
