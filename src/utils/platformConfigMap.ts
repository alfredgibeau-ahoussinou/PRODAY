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
      // Pôle Santé retiré — jamais réactivable depuis Firestore.
      sante_visio: false,
      club_video: flags.club_video === true,
      coach_video: flags.coach_video === true,
    },
    club_pricing: (() => {
      const raw = data.club_pricing as Record<string, unknown> | undefined;
      if (!raw) return DEFAULT_PLATFORM_CONFIG.club_pricing;
      return {
        min_per_member_eur: Number(
          raw.min_per_member_eur ?? DEFAULT_PLATFORM_CONFIG.club_pricing!.min_per_member_eur,
        ),
        standard_per_member_eur: Number(
          raw.standard_per_member_eur ??
            DEFAULT_PLATFORM_CONFIG.club_pricing!.standard_per_member_eur,
        ),
        promo_per_member_eur: Number(
          raw.promo_per_member_eur ??
            DEFAULT_PLATFORM_CONFIG.club_pricing!.promo_per_member_eur,
        ),
      };
    })(),
    updated_at:
      data.updated_at && typeof data.updated_at === 'object' && 'toDate' in data.updated_at
        ? (data.updated_at as { toDate: () => Date }).toDate()
        : undefined,
    updated_by_uid: data.updated_by_uid ? String(data.updated_by_uid) : undefined,
  };
}
