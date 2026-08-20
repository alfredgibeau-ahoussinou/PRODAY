import type { PlatformFeatureFlags } from '../models/PlatformConfig';
import type { MainTabId } from '../navigation/mainTabConfig';

export type PlatformFeatureFlagKey = keyof PlatformFeatureFlags;

export type PlatformFeatureFlagMeta = {
  key: PlatformFeatureFlagKey;
  label: string;
  /** Texte admin (switch hint). */
  adminHint: string;
  /** Message utilisateur quand le flag est OFF. */
  disabledTitle: string;
  disabledMessage: string;
};

/** Métadonnées + copy — source unique admin + app. */
export const PLATFORM_FEATURE_FLAG_META: Record<
  PlatformFeatureFlagKey,
  PlatformFeatureFlagMeta
> = {
  registration_open: {
    key: 'registration_open',
    label: 'Inscriptions ouvertes',
    adminHint: 'Nouveaux comptes. OFF = login OK, signup bloqué',
    disabledTitle: 'Inscriptions fermées',
    disabledMessage:
      'Les créations de compte sont temporairement fermées. Connectez-vous si vous avez déjà un compte, ou réessayez plus tard.',
  },
  community_reels: {
    key: 'community_reels',
    label: 'Reels communauté',
    adminHint: 'Onglet Reels. OFF = masqué + écran indisponible',
    disabledTitle: 'Reels indisponibles',
    disabledMessage:
      'Les Reels communauté sont temporairement désactivés par l’équipe ProDay.',
  },
  mercato: {
    key: 'mercato',
    label: 'Mercato',
    adminHint: 'Onglet Candidater / Mercato. OFF = masqué',
    disabledTitle: 'Mercato indisponible',
    disabledMessage:
      'Le Mercato et le recrutement sont temporairement désactivés.',
  },
  stages: {
    key: 'stages',
    label: 'Stages',
    adminHint: 'Offres stages dans le Mercato. OFF = section masquée',
    disabledTitle: 'Stages indisponibles',
    disabledMessage: 'Les offres de stages sont temporairement désactivées.',
  },
  supporter: {
    key: 'supporter',
    label: 'Football Hub',
    adminHint:
      'Football Hub (ex-Supporter). OFF = coque bloquée. Sync scores externes = Phase 2 admin.',
    disabledTitle: 'Football Hub temporairement fermé',
    disabledMessage:
      'Le Football Hub est temporairement désactivé. Réessayez bientôt.',
  },
  shop: {
    key: 'shop',
    label: 'Boutique ProDay',
    adminHint: 'Onglet Shop. OFF = masqué',
    disabledTitle: 'Boutique indisponible',
    disabledMessage: 'La boutique ProDay est temporairement fermée.',
  },
  sante_visio: {
    key: 'sante_visio',
    label: 'Pôle Santé (retiré)',
    adminHint: 'Retiré — non configurable. Toujours OFF.',
    disabledTitle: 'Pôle Santé indisponible',
    disabledMessage:
      'Le pôle Santé n’est plus proposé sur ProDay. Les comptes concernés restent en lecture fermée.',
  },
  club_video: {
    key: 'club_video',
    label: 'Vidéo Club (Veo)',
    adminHint:
      'ON = Centre Vidéo débloqué pour tous les clubs (sinon : formule Tout inclus / Pro + Veo)',
    disabledTitle: 'Centre Vidéo verrouillé',
    disabledMessage:
      'Le Centre Vidéo Club n’est pas activé. Demandez l’ouverture à ProDay ou passez en formule Tout inclus.',
  },
  coach_video: {
    key: 'coach_video',
    label: 'Vidéo Coach (Veo)',
    adminHint: 'ON = Mes vidéos accessible aux coachs (captation, Live, IA, causerie)',
    disabledTitle: 'Mes vidéos verrouillé',
    disabledMessage:
      'Le module vidéo Coach n’est pas encore ouvert. Réessayez quand ProDay l’aura activé.',
  },
};

/** Onglets bas filtrés par feature flag. */
export const TAB_FEATURE_FLAG: Partial<Record<MainTabId, PlatformFeatureFlagKey>> = {
  recrutement: 'mercato',
  shop: 'shop',
  reels: 'community_reels',
};

export function isPlatformFeatureEnabled(
  flags: PlatformFeatureFlags,
  key: PlatformFeatureFlagKey,
): boolean {
  return flags[key] === true;
}

export function getPlatformFeatureMeta(key: PlatformFeatureFlagKey): PlatformFeatureFlagMeta {
  return PLATFORM_FEATURE_FLAG_META[key];
}

/** Retire les onglets dont le flag plateforme est OFF. */
export function filterTabsByFeatureFlags(
  tabs: MainTabId[],
  flags: PlatformFeatureFlags,
): MainTabId[] {
  return tabs.filter((tab) => {
    const flagKey = TAB_FEATURE_FLAG[tab];
    if (!flagKey) return true;
    return isPlatformFeatureEnabled(flags, flagKey);
  });
}

/** Flag lié à un onglet (si applicable). */
export function featureFlagForTab(tab: MainTabId): PlatformFeatureFlagKey | null {
  return TAB_FEATURE_FLAG[tab] ?? null;
}
