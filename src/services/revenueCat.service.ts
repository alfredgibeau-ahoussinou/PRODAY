/**
 * RevenueCat entitlement layer over App Store / Play Billing.
 *
 * Decision (audit 2026-08): no Stripe Billing path existed for Pro — Stripe is
 * one-time Checkout only (shop + club dues). IAP via expo-iap grants Pro but
 * lacked renewals/cancel sync. RevenueCat is the sole recurring provider;
 * expo-iap remains a fallback when RC API keys are unset.
 */
import { Linking, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { SubscriptionPlanId } from '../content/subscriptionPlans';
import { getIapSku, type IapBillingCycle } from '../content/iapProducts';
import { callFunction } from '../lib/firebaseFunctions';
import { isFirebaseConfigured } from '../config/firebase';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? '';
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? '';

function isNativeStoreBuild(): boolean {
  if (Platform.OS === 'web') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

function platformApiKey(): string {
  if (Platform.OS === 'ios') return IOS_API_KEY;
  if (Platform.OS === 'android') return ANDROID_API_KEY;
  return '';
}

let configured = false;
let configurePromise: Promise<boolean> | null = null;

async function ensureConfigured(appUserId?: string): Promise<boolean> {
  if (!isNativeStoreBuild() || !isFirebaseConfigured()) return false;
  const apiKey = platformApiKey();
  if (!apiKey) return false;

  if (configured) {
    if (appUserId) {
      try {
        const Purchases = (await import('react-native-purchases')).default;
        await Purchases.logIn(appUserId);
      } catch {
        // keep prior session
      }
    }
    return true;
  }

  if (!configurePromise) {
    configurePromise = (async () => {
      try {
        const PurchasesMod = await import('react-native-purchases');
        const Purchases = PurchasesMod.default;
        if (__DEV__) {
          Purchases.setLogLevel(PurchasesMod.LOG_LEVEL.VERBOSE);
        }
        Purchases.configure({
          apiKey,
          appUserID: appUserId || undefined,
        });
        configured = true;
        return true;
      } catch {
        configurePromise = null;
        return false;
      }
    })();
  }
  return configurePromise;
}

async function syncPurchaseToFirestore(params: {
  planId: SubscriptionPlanId;
  productId: string;
  transactionId: string;
}): Promise<{ ok: boolean; message: string }> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return callFunction<
    {
      planId: string;
      productId: string;
      platform: string;
      transactionId: string;
      purchaseToken?: string;
      source?: string;
    },
    { ok: boolean; message: string }
  >('activateStoreSubscription', {
    planId: params.planId,
    productId: params.productId,
    platform,
    transactionId: params.transactionId,
    source: 'revenuecat',
  });
}

export const revenueCatService = {
  /** True when native build + Firebase + RC public API key for this OS. */
  isAvailable(): boolean {
    return isNativeStoreBuild() && isFirebaseConfigured() && Boolean(platformApiKey());
  },

  /** Call once at app startup — configures SDK if keys are present (no duplicate configure). */
  async init(): Promise<void> {
    if (!this.isAvailable()) return;
    await ensureConfigured();
  },

  async identify(uid: string): Promise<void> {
    if (!uid || !this.isAvailable()) return;
    await ensureConfigured(uid);
  },

  async logOut(): Promise<void> {
    if (!configured) return;
    try {
      const Purchases = (await import('react-native-purchases')).default;
      await Purchases.logOut();
    } catch {
      // anonymous reset optional
    }
  },

  async purchasePlan(
    planId: SubscriptionPlanId,
    billing: IapBillingCycle
  ): Promise<{ ok: boolean; message: string }> {
    const sku = getIapSku(planId, billing);
    if (!sku) {
      return {
        ok: false,
        message: 'Ce plan n’est pas encore disponible sur les stores.',
      };
    }

    if (!(await ensureConfigured())) {
      return {
        ok: false,
        message:
          'RevenueCat non configuré. Ajoutez EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / ANDROID_API_KEY (build EAS).',
      };
    }

    try {
      const Purchases = (await import('react-native-purchases')).default;
      const products = await Purchases.getProducts([sku]);
      const product = products[0];
      if (!product) {
        return {
          ok: false,
          message: 'Produit introuvable sur le store. Vérifiez le catalogue RevenueCat.',
        };
      }

      const result = await Purchases.purchaseStoreProduct(product);
      const productIdentifier = result.productIdentifier || sku;
      const storeTxId =
        result.transaction?.transactionIdentifier ||
        `${productIdentifier}_${result.customerInfo.latestExpirationDate ?? Date.now()}`;

      const entitlements = result.customerInfo.entitlements.active;
      if (Object.keys(entitlements).length === 0) {
        return { ok: false, message: 'Achat store sans entitlement actif.' };
      }

      return syncPurchaseToFirestore({
        planId,
        productId: productIdentifier,
        transactionId: String(storeTxId),
      });
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string; code?: string };
      if (err.userCancelled) {
        return { ok: false, message: 'Achat annulé.' };
      }
      return {
        ok: false,
        message: err.message ?? 'Achat RevenueCat impossible.',
      };
    }
  },

  async restorePurchases(): Promise<{ ok: boolean; message: string }> {
    if (!(await ensureConfigured())) {
      return { ok: false, message: 'RevenueCat non disponible.' };
    }
    try {
      const Purchases = (await import('react-native-purchases')).default;
      const info = await Purchases.restorePurchases();
      const active = Object.values(info.entitlements.active);
      if (active.length === 0) {
        return { ok: false, message: 'Aucun abonnement à restaurer.' };
      }
      const productId = active[0]?.productIdentifier;
      if (!productId) {
        return { ok: false, message: 'Produit d’abonnement introuvable.' };
      }
      const { planIdForIapSku } = await import('../content/iapProducts');
      const planId = planIdForIapSku(productId);
      if (!planId) {
        return { ok: false, message: 'SKU restauré non reconnu.' };
      }
      return syncPurchaseToFirestore({
        planId,
        productId,
        transactionId: `restore_${info.originalAppUserId}_${productId}`,
      });
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Restauration impossible.',
      };
    }
  },

  /** Deep link App Store / Play — cancel / renew / change plan. */
  async openManageSubscriptions(): Promise<void> {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions?package=com.proday.app';
    await Linking.openURL(url);
  },
};
