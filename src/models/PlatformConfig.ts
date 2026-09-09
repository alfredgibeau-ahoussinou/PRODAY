/** Configuration globale plateforme — doc Firestore `platform_config/main`. */
export interface PlatformFeatureFlags {
  community_reels: boolean;
  mercato: boolean;
  supporter: boolean;
  shop: boolean;
  stages: boolean;
  registration_open: boolean;
  /**
   * Pôle Santé retiré — toujours OFF (ignoré si présent dans Firestore).
   * Conservé pour compat anciens clients / Remote Config.
   */
  sante_visio: boolean;
  /** Admin : débloque Centre Vidéo Club (Veo / caméras) même hors formule Tout inclus. */
  club_video: boolean;
  /** Admin : débloque Mes vidéos Coach (captation · IA · causerie). */
  coach_video: boolean;
}

/** Quotas / prompt système Coach AI (admin). */
export interface PlatformAiOpsConfig {
  coach_system_prompt: string;
  max_calls_per_user_per_day: number;
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
  /** Commission ProDay sur les transactions sponsor (configurable admin). */
  sponsor_commission?: {
    proday_percent: number;
    min_amount_eur: number;
  };
  /** Tarification devis club (€ / adhérent) — source unique admin. */
  club_pricing?: {
    min_per_member_eur: number;
    standard_per_member_eur: number;
    promo_per_member_eur: number;
  };
  /** Config IA ops (prompt + quotas). */
  ai_ops?: PlatformAiOpsConfig;
  updated_at?: Date;
  updated_by_uid?: string;
}

export const DEFAULT_AI_OPS: PlatformAiOpsConfig = {
  coach_system_prompt:
    "Tu es l'assistant de coaching tactique PRODAY. Ton rôle est d'analyser les matchs et de proposer des axes concrets.",
  max_calls_per_user_per_day: 50,
};

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
    club_video: false,
    coach_video: false,
  },
  club_pricing: {
    min_per_member_eur: 3,
    standard_per_member_eur: 3.5,
    promo_per_member_eur: 2.8,
  },
  ai_ops: { ...DEFAULT_AI_OPS },
};
