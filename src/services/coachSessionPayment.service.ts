import * as WebBrowser from 'expo-web-browser';
import { callFunction } from '../lib/firebaseFunctions';
import { parseCoachSessionCheckoutReturn } from '../utils/coachSessionCheckoutReturn';

/** Démarre Stripe Checkout pour une séance coach acceptée. */
export async function startCoachSessionPayment(
  bookingId: string,
): Promise<{ status: 'success' | 'cancel' | 'dismissed'; sessionId?: string }> {
  const { url, sessionId } = await callFunction<
    { bookingId: string },
    { url: string; sessionId: string }
  >('createCoachSessionCheckoutSession', { bookingId });

  const result = await WebBrowser.openAuthSessionAsync(url, 'proday://coach-session');
  if (result.type === 'success' && result.url) {
    const parsed = parseCoachSessionCheckoutReturn(result.url);
    if (parsed?.status === 'success') return { status: 'success', sessionId };
    if (parsed?.status === 'cancel') return { status: 'cancel', sessionId };
  }
  return { status: 'dismissed', sessionId };
}
