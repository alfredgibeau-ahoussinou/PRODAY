import { usePlatformConfig } from '../context/PlatformConfigContext';
import { platformConfigService } from '../services/platformConfig.service';
import { getPlatformFeatureMeta } from '../content/platformFeatureFlags';

/** Message affiché — pôle Santé retiré. */
export const SANTE_VISIO_BETA_OFF_MESSAGE =
  getPlatformFeatureMeta('sante_visio').disabledTitle;

/**
 * Pôle Santé retiré : toujours OFF (flag admin supprimé).
 */
export function useSanteVisioEnabled(): {
  enabled: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { loading } = usePlatformConfig();
  return {
    enabled: false,
    loading,
    refresh: async () => {
      await platformConfigService.getConfig();
    },
  };
}
