import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_PLATFORM_CONFIG,
  type PlatformConfig,
} from '../models/PlatformConfig';
import { platformConfigService } from '../services/platformConfig.service';

type PlatformConfigContextValue = {
  config: PlatformConfig;
  loading: boolean;
};

const PlatformConfigContext = createContext<PlatformConfigContextValue>({
  config: DEFAULT_PLATFORM_CONFIG,
  loading: true,
});

export const PlatformConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_PLATFORM_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = platformConfigService.subscribeConfig((next) => {
      setConfig(next);
      setLoading(false);
    });
    return () => {
      unsub?.();
    };
  }, []);

  const value = useMemo(() => ({ config, loading }), [config, loading]);

  return (
    <PlatformConfigContext.Provider value={value}>
      {children}
    </PlatformConfigContext.Provider>
  );
};

export function usePlatformConfig(): PlatformConfigContextValue {
  return useContext(PlatformConfigContext);
}
