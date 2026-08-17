import * as WebBrowser from 'expo-web-browser';
import { callFunction } from '../lib/firebaseFunctions';
import type { SubscriptionPlanId } from '../content/subscriptionPlans';
import { parseSubscriptionCheckoutReturn } from '../utils/subscriptionCheckoutReturn';

export async function startSubscriptionCheckout(
  planId: SubscriptionPlanId,
  billing: 'monthly' | 'yearly'
): Promise<{ ok: boolean; message: string }> {
  const { url } = await callFunction<
    { planId: string; billing: string },
    { url: string; sessionId: string }
  >('createSubscriptionCheckoutSession', { planId, billing });

  const result = await WebBrowser.openAuthSessionAsync(url, 'proday://subscription');
  if (result.type === 'success' && result.url) {
    const parsed = parseSubscriptionCheckoutReturn(result.url);
    if (parsed?.status === 'success') {
      return {
        ok: true,
        message: 'Paiement Stripe terminé. Votre abonnement Pro s’active sous quelques secondes.',
      };
    }
    if (parsed?.status === 'cancel') {
      return { ok: false, message: 'Paiement annulé.' };
    }
  }
  if (result.type === 'cancel') {
    return { ok: false, message: 'Paiement annulé.' };
  }
  return {
    ok: true,
    message: 'Fenêtre Stripe fermée. Si vous avez payé, l’abonnement s’activera via le webhook.',
  };
}

export async function openStripeBillingPortal(): Promise<{ ok: boolean; message: string }> {
  const { url } = await callFunction<Record<string, never>, { url: string }>(
    'createBillingPortalSession',
    {}
  );
  await WebBrowser.openAuthSessionAsync(url, 'proday://subscription');
  return { ok: true, message: 'Portail Stripe ouvert.' };
}
