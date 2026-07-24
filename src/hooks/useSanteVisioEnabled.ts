import { usePlatformConfig } from '../context/PlatformConfigContext';
import { platformConfigService } from '../services/platformConfig.service';
import {
  getPlatformFeatureMeta,
  isPlatformFeatureEnabled,
} from '../content/platformFeatureFlags';

/** Message affiché quand la visio Santé est coupée (bêta). */
export const SANTE_VISIO_BETA_OFF_MESSAGE =
  getPlatformFeatureMeta('sante_visio').disabledTitle;

/**
 * Flag plateforme `sante_visio` (défaut OFF).
 * Admin → Système → Feature flags pour activer/désactiver.
 */
export function useSanteVisioEnabled(): {
  enabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { config, loading } = usePlatformConfig();
  return {
    enabled: isPlatformFeatureEnabled(config.feature_flags, 'sante_visio'),
    loading,
    refresh: async () => {
      await platformConfigService.getConfig();
    },
  };
}
