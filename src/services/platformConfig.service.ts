import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import {
  DEFAULT_PLATFORM_CONFIG,
  type PlatformConfig,
  type PlatformFeatureFlags,
} from '../models/PlatformConfig';

const DOC_PATH = 'platform_config/main';

function mapConfig(data: Record<string, unknown>): PlatformConfig {
  const flags = (data.feature_flags as Record<string, unknown> | undefined) ?? {};
  return {
    maintenance_mode: Boolean(data.maintenance_mode),
    maintenance_message: String(
      data.maintenance_message ?? DEFAULT_PLATFORM_CONFIG.maintenance_message,
    ),
    feature_flags: {
      community_reels: flags.community_reels !== false,
      mercato: flags.mercato !== false,
      supporter: flags.supporter !== false,
      shop: flags.shop !== false,
      stages: flags.stages !== false,
      registration_open: flags.registration_open !== false,
    },
    updated_at:
      data.updated_at && typeof data.updated_at === 'object' && 'toDate' in data.updated_at
        ? (data.updated_at as { toDate: () => Date }).toDate()
        : undefined,
    updated_by_uid: data.updated_by_uid ? String(data.updated_by_uid) : undefined,
  };
}

export const platformConfigService = {
  async getConfig(): Promise<PlatformConfig> {
    if (!isFirebaseConfigured()) return DEFAULT_PLATFORM_CONFIG;
    const database = getDb();
    if (!database) return DEFAULT_PLATFORM_CONFIG;

    const snap = await getDoc(doc(database, DOC_PATH));
    if (!snap.exists()) return DEFAULT_PLATFORM_CONFIG;
    return mapConfig(snap.data() as Record<string, unknown>);
  },

  async saveConfig(
    patch: Partial<
      Pick<PlatformConfig, 'maintenance_mode' | 'maintenance_message'> & {
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

    await setDoc(
      doc(database, DOC_PATH),
      {
        maintenance_mode: patch.maintenance_mode ?? current.maintenance_mode,
        maintenance_message: patch.maintenance_message ?? current.maintenance_message,
        feature_flags: nextFlags,
        updated_at: serverTimestamp(),
        updated_by_uid: actorUid,
      },
      { merge: true },
    );
  },
};
