import { useCallback, useEffect, useState } from 'react';
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
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const config = await platformConfigService.getConfig();
      setEnabled(config.feature_flags.sante_visio === true);
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { enabled, loading, refresh };
}
