import type { WearableHealthMetrics } from './types';

export async function connectWearableHealth(): Promise<WearableHealthMetrics> {
  throw new Error('Connexion santé disponible uniquement sur l’app iOS ou Android.');
}

export async function fetchWearableMetrics(): Promise<WearableHealthMetrics> {
  throw new Error('Connexion santé disponible uniquement sur l’app iOS ou Android.');
}
