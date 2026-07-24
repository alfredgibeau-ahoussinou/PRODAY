import { useCallback, useMemo } from 'react';
import { usePlatformConfig } from '../context/PlatformConfigContext';
import {
  featureFlagForTab,
  filterTabsByFeatureFlags,
  getPlatformFeatureMeta,
  isPlatformFeatureEnabled,
  type PlatformFeatureFlagKey,
} from '../content/platformFeatureFlags';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { PlatformFeatureFlags } from '../models/PlatformConfig';

export function usePlatformFeatureFlags(): {
  flags: PlatformFeatureFlags;
  loading: boolean;
  isEnabled: (key: PlatformFeatureFlagKey) => boolean;
  filterTabs: (tabs: MainTabId[]) => MainTabId[];
  disabledCopy: (key: PlatformFeatureFlagKey) => {
    title: string;
    message: string;
  };
  flagForTab: (tab: MainTabId) => PlatformFeatureFlagKey | null;
} {
  const { config, loading } = usePlatformConfig();
  const flags = config.feature_flags;

  const isEnabled = useCallback(
    (key: PlatformFeatureFlagKey) => isPlatformFeatureEnabled(flags, key),
    [flags],
  );

  const filterTabs = useCallback(
    (tabs: MainTabId[]) => filterTabsByFeatureFlags(tabs, flags),
    [flags],
  );

  const disabledCopy = useCallback((key: PlatformFeatureFlagKey) => {
    const meta = getPlatformFeatureMeta(key);
    return { title: meta.disabledTitle, message: meta.disabledMessage };
  }, []);

  return useMemo(
    () => ({
      flags,
      loading,
      isEnabled,
      filterTabs,
      disabledCopy,
      flagForTab: featureFlagForTab,
    }),
    [flags, loading, isEnabled, filterTabs, disabledCopy],
  );
}
