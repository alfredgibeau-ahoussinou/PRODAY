import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { SubscriptionPlanId } from '../content/subscriptionPlans';
import { getIapSku, type IapBillingCycle } from '../content/iapProducts';
import { callFunction } from '../lib/firebaseFunctions';
import { isFirebaseConfigured } from '../config/firebase';

function isNativeStoreBuild(): boolean {
  if (Platform.OS === 'web') return false;
  // Android : expo-iap temporairement exclu du binary (crash cold start).
  if (Platform.OS === 'android') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

let connectionPromise: Promise<boolean> | null = null;

async function ensureConnection(): Promise<boolean> {
  if (!isNativeStoreBuild()) return false;
  if (!connectionPromise) {
    connectionPromise = (async () => {
      try {
        const iap = await import('expo-iap');
        return await iap.initConnection();
      } catch {
        connectionPromise = null;
        return false;
      }
    })();
  }
  return connectionPromise;
}

export const iapService = {
  isAvailable(): boolean {
    return isNativeStoreBuild() && isFirebaseConfigured();
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

    if (!(await ensureConnection())) {
      return {
        ok: false,
        message:
          'Les achats in-app nécessitent un build natif (EAS ou expo run:ios). Non disponible dans Expo Go.',
      };
    }

    const iap = await import('expo-iap');

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: { ok: boolean; message: string }) => {
        if (settled) return;
        settled = true;
        successSub.remove();
        errorSub.remove();
        resolve(result);
      };

      const successSub = iap.purchaseUpdatedListener(async (purchase) => {
        if (purchase.productId !== sku) return;
        try {
          const platform = Platform.OS === 'ios' ? 'ios' : 'android';
          const transactionId = String(
            purchase.transactionId ?? purchase.id ?? purchase.purchaseToken ?? ''
          );
          if (!transactionId) {
            finish({ ok: false, message: 'Transaction store incomplète.' });
            return;
          }

          const result = await callFunction<
            {
              planId: string;
              productId: string;
              platform: string;
              transactionId: string;
              purchaseToken?: string;
            },
            { ok: boolean; message: string }
          >('activateStoreSubscription', {
            planId,
            productId: purchase.productId,
            platform,
            transactionId,
            purchaseToken: purchase.purchaseToken
              ? String(purchase.purchaseToken)
              : undefined,
          });

          try {
            await iap.finishTransaction({ purchase, isConsumable: false });
          } catch {
            // Achat déjà validé côté serveur — ignorer erreur finishTransaction.
          }
          finish(result);
        } catch (e) {
          finish({
            ok: false,
            message: e instanceof Error ? e.message : 'Activation abonnement impossible.',
          });
        }
      });

      const errorSub = iap.purchaseErrorListener((error) => {
        const code = String(error.code ?? '');
        if (code.toLowerCase().includes('cancel')) {
          finish({ ok: false, message: 'Achat annulé.' });
          return;
        }
        finish({
          ok: false,
          message: error.message ?? 'Achat impossible.',
        });
      });

      void (async () => {
        try {
          await iap.fetchProducts({ skus: [sku], type: 'subs' });
          await iap.requestPurchase({
            type: 'subs',
            request: {
              apple: { sku },
              google: { skus: [sku] },
            },
          });
        } catch (e) {
          finish({
            ok: false,
            message: e instanceof Error ? e.message : 'Impossible d’ouvrir le paiement store.',
          });
        }
      })();
    });
  },
};
