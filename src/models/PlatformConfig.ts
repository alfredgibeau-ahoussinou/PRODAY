/** Configuration globale plateforme — doc Firestore `platform_config/main`. */
export interface PlatformFeatureFlags {
  community_reels: boolean;
  mercato: boolean;
  supporter: boolean;
  shop: boolean;
  stages: boolean;
  registration_open: boolean;
  /** Téléconsultation Santé (Cal/Daily). Défaut OFF en bêta. */
  sante_visio: boolean;
}

export interface PlatformConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  feature_flags: PlatformFeatureFlags;
  /** Commissions coaching à l’heure (admin). */
  coaching_commission?: {
    proday_percent: number;
    club_percent: number;
    hourly_rate_min_eur: number;
    hourly_rate_max_eur: number;
  };
  updated_at?: Date;
  updated_by_uid?: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  maintenance_mode: false,
  maintenance_message: 'ProDay est momentanément indisponible pour maintenance.',
  feature_flags: {
    community_reels: true,
    mercato: true,
    supporter: true,
    shop: true,
    stages: true,
    registration_open: true,
    sante_visio: false,
  },
};
