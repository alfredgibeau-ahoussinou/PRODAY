import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { WearableHealthMetrics } from './types';

function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export async function connectWearableHealth(): Promise<WearableHealthMetrics> {
  if (isExpoGo()) {
    throw new Error(
      'Apple Santé / Google Health nécessite un build natif (expo run:ios), pas Expo Go.',
    );
  }
  if (Platform.OS === 'ios') {
    const mod = await import('./connect.ios.impl');
    return mod.connectWearableHealth();
  }
  if (Platform.OS === 'android') {
    const mod = await import('./connect.android.impl');
    return mod.connectWearableHealth();
  }
  throw new Error('Connexion santé disponible uniquement sur l’app iOS ou Android.');
}

export async function fetchWearableMetrics(): Promise<WearableHealthMetrics> {
  if (isExpoGo()) {
    throw new Error(
      'Synchronisation santé indisponible dans Expo Go. Utilisez un build natif.',
    );
  }
  if (Platform.OS === 'ios') {
    const mod = await import('./connect.ios.impl');
    return mod.fetchWearableMetrics();
  }
  if (Platform.OS === 'android') {
    const mod = await import('./connect.android.impl');
    return mod.fetchWearableMetrics();
  }
  throw new Error('Connexion santé disponible uniquement sur l’app iOS ou Android.');
}
