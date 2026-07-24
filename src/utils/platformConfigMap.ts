import {
  DEFAULT_PLATFORM_CONFIG,
  type PlatformConfig,
} from '../models/PlatformConfig';

/** Parse le doc Firestore `platform_config/main` (sans dépendre du SDK). */
export function mapPlatformConfig(data: Record<string, unknown>): PlatformConfig {
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
      sante_visio: flags.sante_visio === true,
    },
    updated_at:
      data.updated_at && typeof data.updated_at === 'object' && 'toDate' in data.updated_at
        ? (data.updated_at as { toDate: () => Date }).toDate()
        : undefined,
    updated_by_uid: data.updated_by_uid ? String(data.updated_by_uid) : undefined,
  };
}
