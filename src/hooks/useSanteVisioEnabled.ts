import { usePlatformConfig } from '../context/PlatformConfigContext';
import { platformConfigService } from '../services/platformConfig.service';

/** Message affiché quand la visio Santé est coupée (bêta). */
export const SANTE_VISIO_BETA_OFF_MESSAGE =
  'Bêta actuelle — aucun accès à la visio';

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
    enabled: config.feature_flags.sante_visio === true,
    loading,
    refresh: async () => {
      await platformConfigService.getConfig();
    },
  };
}
