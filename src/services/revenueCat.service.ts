/**
 * RevenueCat entitlement layer over App Store / Play Billing (repli IAP).
 * Abonnements Pro prioritaires : Stripe Checkout — voir subscriptionPayment.service.ts.
 */
import { Linking, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { SubscriptionPlanId } from '../content/subscriptionPlans';
import { getIapSku, type IapBillingCycle } from '../content/iapProducts';
import { callFunction } from '../lib/firebaseFunctions';
import { isFirebaseConfigured } from '../config/firebase';

export type RevenueCatPurchaseResult = {
  ok: boolean;
  message: string;
  /** When true, `iap.service` should try expo-iap instead of surfacing this error. */
  useExpoIapFallback?: boolean;
};

type RevenueCatExtra = {
  iosApiKey?: string;
  androidApiKey?: string;
};

function coalesceKey(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const v = typeof c === 'string' ? c.trim() : '';
    if (v) return v;
  }
  return '';
}

function extraRevenueCat(): RevenueCatExtra {
  const extra = Constants.expoConfig?.extra as { revenueCat?: RevenueCatExtra } | null | undefined;
  return extra?.revenueCat ?? {};
}

/** Prefer Metro-inlined EXPO_PUBLIC_* then app.config `extra` (EAS / restart-safe). */
function platformApiKey(): string {
  const fromExtra = extraRevenueCat();
  if (Platform.OS === 'ios') {
    return coalesceKey(
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      fromExtra.iosApiKey
    );
  }
  if (Platform.OS === 'android') {
    return coalesceKey(
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      fromExtra.androidApiKey
    );
  }
  return '';
}

/** Clés sandbox RC (`test_…`) vs prod store (`appl_…` / `goog_…`). */
export function isRevenueCatTestStoreKey(apiKey: string): boolean {
  return apiKey.startsWith('test_') || apiKey.startsWith('rcb_');
}

function isNativeStoreBuild(): boolean {
  if (Platform.OS === 'web') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

let configured = false;
let configurePromise: Promise<boolean> | null = null;
/** Dernier appUserID synchronisé avec Purchases.logIn — évite les logIn redondants. */
let identifiedAppUserId: string | null = null;

async function ensureConfigured(appUserId?: string): Promise<boolean> {
  if (!isNativeStoreBuild() || !isFirebaseConfigured()) return false;
  const apiKey = platformApiKey();
  if (!apiKey) return false;

  if (configured) {
    if (appUserId && appUserId !== identifiedAppUserId) {
      try {
        const Purchases = (await import('react-native-purchases')).default;
        await Purchases.logIn(appUserId);
        identifiedAppUserId = appUserId;
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
          // WARN : moins de bruit Paywalls V2 / ui_config que INFO/VERBOSE.
          Purchases.setLogLevel(PurchasesMod.LOG_LEVEL.WARN);
        } else {
          Purchases.setLogLevel(PurchasesMod.LOG_LEVEL.ERROR);
        }

        if (!__DEV__ && isRevenueCatTestStoreKey(apiKey)) {
          console.warn(
            '[RevenueCat] Clé Test Store détectée dans un build non-__DEV__. Utilisez appl_… / goog_… (EAS secrets production).'
          );
        }

        Purchases.configure({
          apiKey,
          appUserID: appUserId || undefined,
        });
        configured = true;
        identifiedAppUserId = appUserId ?? null;
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
}): Promise<RevenueCatPurchaseResult> {
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

  hasApiKey(): boolean {
    return Boolean(platformApiKey());
  },

  /** True si la clé courante est une clé sandbox / Test Store. */
  isUsingTestStoreKey(): boolean {
    const key = platformApiKey();
    return Boolean(key) && isRevenueCatTestStoreKey(key);
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
      const info = await Purchases.getCustomerInfo();
      // RC logue une ERROR si on logOut un user déjà anonyme (bruit LogBox).
      if (info.originalAppUserId.startsWith('$RCAnonymousID:')) {
        identifiedAppUserId = null;
        return;
      }
      await Purchases.logOut();
      identifiedAppUserId = null;
    } catch {
      // anonymous / SDK non prêt — ignore
    }
  },

  async purchasePlan(
    planId: SubscriptionPlanId,
    billing: IapBillingCycle
  ): Promise<RevenueCatPurchaseResult> {
    const sku = getIapSku(planId, billing);
    if (!sku) {
      return {
        ok: false,
        message: 'Ce plan n’est pas encore disponible sur les stores.',
      };
    }

    if (!(await ensureConfigured())) {
      const hasKey = Boolean(platformApiKey());
      return {
        ok: false,
        useExpoIapFallback: true,
        message: hasKey
          ? 'RevenueCat indisponible sur ce build (SDK). Repli store natif…'
          : 'RevenueCat non configuré. Ajoutez EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / ANDROID_API_KEY dans `.env`, relancez Metro (`npx expo start -c`), ou définissez les secrets EAS puis rebuild.',
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

  async restorePurchases(): Promise<RevenueCatPurchaseResult> {
    if (!(await ensureConfigured())) {
      return {
        ok: false,
        useExpoIapFallback: true,
        message: 'RevenueCat non disponible — restauration via clés API requise.',
      };
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
