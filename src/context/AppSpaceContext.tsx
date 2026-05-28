import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_SPACE_LABELS,
  DEFAULT_APP_SPACE,
  normalizeAppSpace,
  type AppSpaceId,
} from '../models/AppSpace';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'proday_app_space';

interface AppSpaceContextValue {
  appSpace: AppSpaceId;
  label: string;
  setAppSpace: (space: AppSpaceId) => Promise<void>;
  isWomenSpace: boolean;
  isGirlsSpace: boolean;
  isMenSpace: boolean;
  isBoysSpace: boolean;
  isUnderU13Space: boolean;
  loading: boolean;
}

const AppSpaceContext = createContext<AppSpaceContextValue | null>(null);

export const AppSpaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { profile } = useAuth();
  const [appSpace, setAppSpaceState] = useState<AppSpaceId>(DEFAULT_APP_SPACE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const next = normalizeAppSpace(profile?.app_space ?? stored ?? DEFAULT_APP_SPACE);
        if (!cancelled) setAppSpaceState(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.app_space, profile?.uid]);

  const setAppSpace = useCallback(async (space: AppSpaceId) => {
    setAppSpaceState(space);
    await AsyncStorage.setItem(STORAGE_KEY, space);
  }, []);

  const value = useMemo(
    () => ({
      appSpace,
      label: APP_SPACE_LABELS[appSpace],
      setAppSpace,
      isWomenSpace: appSpace === 'women',
      isGirlsSpace: appSpace === 'girls',
      isMenSpace: appSpace === 'men',
      isBoysSpace: appSpace === 'boys',
      isUnderU13Space: appSpace === 'under_u13',
      loading,
    }),
    [appSpace, setAppSpace, loading]
  );

  return (
    <AppSpaceContext.Provider value={value}>{children}</AppSpaceContext.Provider>
  );
};

export function useAppSpace(): AppSpaceContextValue {
  const ctx = useContext(AppSpaceContext);
  if (!ctx) throw new Error('useAppSpace doit être utilisé dans AppSpaceProvider');
  return ctx;
}
