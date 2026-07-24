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
    label: 'Tribune supporter',
    adminHint: 'Espace Supporter. OFF = coque bloquée pour les fans',
    disabledTitle: 'Tribune temporairement fermée',
    disabledMessage:
      'L’espace Supporter est temporairement désactivé. Réessayez bientôt.',
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
    label: 'Visio Santé',
    adminHint:
      'OFF = écran de coupure plein (onglet Santé toujours visible)',
    disabledTitle: 'Visio Santé indisponible',
    disabledMessage:
      'La téléconsultation est momentanément fermée. L’équipe ProDay la réouvrira depuis l’admin.',
  },
};

/** Onglets bas filtrés par feature flag. */
export const TAB_FEATURE_FLAG: Partial<Record<MainTabId, PlatformFeatureFlagKey>> = {
  recrutement: 'mercato',
  shop: 'shop',
  reels: 'community_reels',
  // `sante` volontairement absent : l’onglet reste visible ; le contenu est
  // coupé en plein écran via FeatureBlockedScreen si `sante_visio` est OFF.
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
