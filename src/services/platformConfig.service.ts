import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  DEFAULT_PLATFORM_CONFIG,
  type PlatformConfig,
  type PlatformFeatureFlags,
  type PlatformAiOpsConfig,
} from '../models/PlatformConfig';
import { mapPlatformConfig } from '../utils/platformConfigMap';

export { mapPlatformConfig };

const DOC_PATH = 'platform_config/main';
const STORAGE_KEY = '@proday_platform_config';

// In-memory active singleton state
let inMemoryConfig: PlatformConfig = { ...DEFAULT_PLATFORM_CONFIG };
const localSubscribers = new Set<(config: PlatformConfig) => void>();

function notifyLocalSubscribers(config: PlatformConfig) {
  inMemoryConfig = config;
  localSubscribers.forEach((cb) => {
    try {
      cb(config);
    } catch (e) {
      console.warn('[platformConfigService] Subscriber error:', e);
    }
  });
}

// Initial hydration from AsyncStorage in background
void (async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      inMemoryConfig = {
        ...DEFAULT_PLATFORM_CONFIG,
        ...parsed,
        feature_flags: {
          ...DEFAULT_PLATFORM_CONFIG.feature_flags,
          ...(parsed.feature_flags || {}),
        },
      };
      notifyLocalSubscribers(inMemoryConfig);
    }
  } catch {
    // No-op
  }
})();

export const platformConfigService = {
  /** Récupère la config actuelle (mémoire > local storage > Firestore). */
  async getConfig(): Promise<PlatformConfig> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        inMemoryConfig = {
          ...DEFAULT_PLATFORM_CONFIG,
          ...parsed,
          feature_flags: {
            ...DEFAULT_PLATFORM_CONFIG.feature_flags,
            ...(parsed.feature_flags || {}),
          },
        };
      }
    } catch {
      // Pas de blocage
    }

    if (!isFirebaseConfigured()) return inMemoryConfig;
    const database = getDb();
    if (!database) return inMemoryConfig;

    try {
      const snap = await getDoc(doc(database, DOC_PATH));
      if (snap.exists()) {
        const remote = mapPlatformConfig(snap.data() as Record<string, unknown>);
        inMemoryConfig = remote;
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remote)).catch(() => {});
        return remote;
      }
    } catch (err) {
      console.warn('[platformConfigService] Failed to fetch remote config, using local cache:', err);
    }
    return inMemoryConfig;
  },

  /** Écoute live — les clients voient maintenance / flags instantanément sans redémarrer. */
  subscribeConfig(onUpdate: (config: PlatformConfig) => void): Unsubscribe {
    // 1. Enregistrer dans les abonnés locaux
    localSubscribers.add(onUpdate);
    // Notification immédiate avec la valeur courante
    onUpdate(inMemoryConfig);

    // 2. Écoute Firestore temps réel si Firebase actif
    let firestoreUnsub: Unsubscribe | null = null;
    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          firestoreUnsub = onSnapshot(
            doc(database, DOC_PATH),
            (snap) => {
              if (snap.exists()) {
                const next = mapPlatformConfig(snap.data() as Record<string, unknown>);
                notifyLocalSubscribers(next);
                void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
              }
            },
            () => {
              // En cas d'erreur de snapshot, rester sur la valeur inMemory
            },
          );
        } catch {
          // Ignorer erreur d'attachement
        }
      }
    }

    return () => {
      localSubscribers.delete(onUpdate);
      firestoreUnsub?.();
    };
  },

  /** Toggle 1-tap du mode maintenance (Kill-Switch opérationnel immédiat). */
  async setMaintenanceMode(
    enabled: boolean,
    message?: string,
    actorUid: string = 'admin',
  ): Promise<PlatformConfig> {
    const current = inMemoryConfig;
    const next: PlatformConfig = {
      ...current,
      maintenance_mode: enabled,
      maintenance_message: message !== undefined ? message : current.maintenance_message,
      updated_at: new Date(),
      updated_by_uid: actorUid,
    };

    // 1. Notification synchrone immédiate de tous les écrans & contextes
    notifyLocalSubscribers(next);

    // 2. Sauvegarde persistante locale (AsyncStorage)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[platformConfigService] Failed to persist config locally:', e);
    }

    // 3. Réplication Firestore (en arrière-plan si dispo)
    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          await setDoc(
            doc(database, DOC_PATH),
            {
              maintenance_mode: enabled,
              ...(message !== undefined ? { maintenance_message: message } : {}),
              updated_at: serverTimestamp(),
              updated_by_uid: actorUid,
            },
            { merge: true },
          );
        } catch (e) {
          console.warn('[platformConfigService] Firestore maintenance update warning:', e);
        }
      }
    }

    return next;
  },

  /** Sauvegarde générique de la configuration plateforme. */
  async saveConfig(
    patch: Partial<
      Pick<
        PlatformConfig,
        'maintenance_mode' | 'maintenance_message' | 'club_pricing' | 'ai_ops'
      > & {
        feature_flags: Partial<PlatformFeatureFlags>;
      }
    >,
    actorUid: string = 'admin',
  ): Promise<void> {
    const current = inMemoryConfig;
    const nextFlags: PlatformFeatureFlags = {
      ...current.feature_flags,
      ...(patch.feature_flags ?? {}),
    };
    const nextPricing = {
      ...(current.club_pricing ?? DEFAULT_PLATFORM_CONFIG.club_pricing!),
      ...(patch.club_pricing ?? {}),
    };
    const nextAi: PlatformAiOpsConfig = {
      ...(current.ai_ops ?? DEFAULT_PLATFORM_CONFIG.ai_ops!),
      ...(patch.ai_ops ?? {}),
    };

    const next: PlatformConfig = {
      ...current,
      maintenance_mode: patch.maintenance_mode ?? current.maintenance_mode,
      maintenance_message: patch.maintenance_message ?? current.maintenance_message,
      feature_flags: nextFlags,
      club_pricing: nextPricing,
      ai_ops: nextAi,
      updated_at: new Date(),
      updated_by_uid: actorUid,
    };

    // 1. Mise à jour synchrone immédiate
    notifyLocalSubscribers(next);

    // 2. Persistance locale
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // No-op
    }

    // 3. Persistance Firestore si configuré
    if (isFirebaseConfigured()) {
      const database = getDb();
      if (database) {
        try {
          await setDoc(
            doc(database, DOC_PATH),
            {
              maintenance_mode: next.maintenance_mode,
              maintenance_message: next.maintenance_message,
              feature_flags: nextFlags,
              club_pricing: nextPricing,
              ai_ops: nextAi,
              updated_at: serverTimestamp(),
              updated_by_uid: actorUid,
            },
            { merge: true },
          );
        } catch (e) {
          console.warn('[platformConfigService] Firestore saveConfig warning:', e);
        }
      }
    }
  },
};
