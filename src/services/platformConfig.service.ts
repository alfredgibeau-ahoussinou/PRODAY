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

export const platformConfigService = {
  async getConfig(): Promise<PlatformConfig> {
    if (!isFirebaseConfigured()) return DEFAULT_PLATFORM_CONFIG;
    const database = getDb();
    if (!database) return DEFAULT_PLATFORM_CONFIG;

    const snap = await getDoc(doc(database, DOC_PATH));
    if (!snap.exists()) return DEFAULT_PLATFORM_CONFIG;
    return mapPlatformConfig(snap.data() as Record<string, unknown>);
  },

  /** Écoute live — les clients voient maintenance / flags sans redémarrer. */
  subscribeConfig(onUpdate: (config: PlatformConfig) => void): Unsubscribe | null {
    if (!isFirebaseConfigured()) {
      onUpdate(DEFAULT_PLATFORM_CONFIG);
      return null;
    }
    const database = getDb();
    if (!database) {
      onUpdate(DEFAULT_PLATFORM_CONFIG);
      return null;
    }

    return onSnapshot(
      doc(database, DOC_PATH),
      (snap) => {
        if (!snap.exists()) {
          onUpdate(DEFAULT_PLATFORM_CONFIG);
          return;
        }
        onUpdate(mapPlatformConfig(snap.data() as Record<string, unknown>));
      },
      () => {
        onUpdate(DEFAULT_PLATFORM_CONFIG);
      },
    );
  },

  async saveConfig(
    patch: Partial<
      Pick<
        PlatformConfig,
        'maintenance_mode' | 'maintenance_message' | 'club_pricing' | 'ai_ops'
      > & {
        feature_flags: Partial<PlatformFeatureFlags>;
      }
    >,
    actorUid: string,
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');

    const current = await this.getConfig();
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

    await setDoc(
      doc(database, DOC_PATH),
      {
        maintenance_mode: patch.maintenance_mode ?? current.maintenance_mode,
        maintenance_message: patch.maintenance_message ?? current.maintenance_message,
        feature_flags: nextFlags,
        club_pricing: nextPricing,
        ai_ops: nextAi,
        updated_at: serverTimestamp(),
        updated_by_uid: actorUid,
      },
      { merge: true },
    );
  },
};
