import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectWearableHealth,
  fetchWearableMetrics,
  getWearablePlatformLabel,
  isWearableHealthSupported,
} from '../services/wearableHealth';
import type { WearableHealthMetrics } from '../services/wearableHealth/types';
import type { WearableDailySnapshot } from '../services/wearableHealth/types';
import { wearableHistoryService } from '../services/wearableHealth/wearableHistory';

const STORAGE_KEY = '@proday/wearable_health_v1';

interface StoredWearableState {
  connected: boolean;
  metrics: WearableHealthMetrics;
}

export function useWearableHealth() {
  const [metrics, setMetrics] = useState<WearableHealthMetrics | null>(null);
  const [history, setHistory] = useState<WearableDailySnapshot[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(async (next: StoredWearableState | null) => {
    if (!next) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const storeMetrics = useCallback(
    async (nextMetrics: WearableHealthMetrics) => {
      setMetrics(nextMetrics);
      const nextHistory = await wearableHistoryService.append(nextMetrics);
      setHistory(nextHistory);
      await persist({ connected: true, metrics: nextMetrics });
    },
    [persist],
  );

  const loadStored = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setHistory(await wearableHistoryService.list(30));
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredWearableState;
      if (parsed.connected && parsed.metrics) {
        setConnected(true);
        setMetrics(parsed.metrics);
        if (isWearableHealthSupported()) {
          try {
            const fresh = await fetchWearableMetrics();
            await storeMetrics(fresh);
          } catch {
            // Garde les dernières métriques connues si la synchro échoue.
          }
        }
      }
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, [persist, storeMetrics]);

  useEffect(() => {
    void loadStored();
  }, [loadStored]);

  const connect = useCallback(async () => {
    if (!isWearableHealthSupported()) {
      setError('Connexion santé disponible uniquement sur iOS et Android.');
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      const nextMetrics = await connectWearableHealth();
      setConnected(true);
      await storeMetrics(nextMetrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible.');
    } finally {
      setSyncing(false);
    }
  }, [storeMetrics]);

  const refresh = useCallback(async () => {
    if (!connected) {
      await connect();
      return;
    }
    setSyncing(true);
    setError(null);
    try {
      const nextMetrics = await fetchWearableMetrics();
      await storeMetrics(nextMetrics);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Synchronisation impossible.');
    } finally {
      setSyncing(false);
    }
  }, [connected, connect, storeMetrics]);

  useEffect(() => {
    if (!connected) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [connected, refresh]);

  const disconnect = useCallback(async () => {
    setConnected(false);
    setMetrics(null);
    setError(null);
    await persist(null);
  }, [persist]);

  return {
    metrics,
    history,
    connected,
    loading,
    syncing,
    error,
    connect,
    refresh,
    disconnect,
    platformLabel: getWearablePlatformLabel(),
    supported: isWearableHealthSupported(),
  };
}
