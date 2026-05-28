import { Platform } from 'react-native';
import {
  isFirebaseConfigured,
  isFirebaseStorageConfigured,
  firebaseConfig,
} from './firebase';
import { googleOAuth, getGoogleAuthRequestConfig } from './oauth';

export type ConfigSeverity = 'error' | 'warning';

export interface ConfigIssue {
  id: string;
  severity: ConfigSeverity;
  title: string;
  detail: string;
}

function projectPrefix(clientId: string | undefined): string | null {
  if (!clientId?.includes('.apps.googleusercontent.com')) return null;
  const match = clientId.match(/^(\d+)-/);
  return match?.[1] ?? null;
}

function isValidGoogleClientId(value: string | undefined): boolean {
  return Boolean(value?.trim().endsWith('.apps.googleusercontent.com'));
}

/** Problèmes de configuration détectés au démarrage. */
export function getAppConfigIssues(): ConfigIssue[] {
  const issues: ConfigIssue[] = [];

  if (!isFirebaseConfigured()) {
    issues.push({
      id: 'firebase-missing',
      severity: 'error',
      title: 'Firebase non configuré',
      detail:
        'Copiez .env.example vers .env et renseignez les clés EXPO_PUBLIC_FIREBASE_* (voir docs/FIREBASE_SETUP.md).',
    });
    return issues;
  }

  if (!isFirebaseStorageConfigured()) {
    issues.push({
      id: 'storage-missing',
      severity: 'warning',
      title: 'Firebase Storage',
      detail:
        'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET manquant — photos de profil et documents indisponibles.',
    });
  }

  const googleReady = getGoogleAuthRequestConfig() !== null;
  if (!googleReady) {
    issues.push({
      id: 'google-missing',
      severity: 'warning',
      title: 'Connexion Google',
      detail:
        Platform.OS === 'ios'
          ? 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID et EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID dans .env.'
          : 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (et Android si besoin) dans .env.',
    });
  } else {
    if (!isValidGoogleClientId(googleOAuth.webClientId)) {
      issues.push({
        id: 'google-web-invalid',
        severity: 'warning',
        title: 'ID client Google (Web)',
        detail: 'Format attendu : xxxxx.apps.googleusercontent.com',
      });
    }
    if (Platform.OS === 'ios' && !isValidGoogleClientId(googleOAuth.iosClientId)) {
      issues.push({
        id: 'google-ios-invalid',
        severity: 'warning',
        title: 'ID client Google (iOS)',
        detail: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID invalide ou manquant.',
      });
    }

    const webPrefix = projectPrefix(googleOAuth.webClientId);
    const iosPrefix = projectPrefix(googleOAuth.iosClientId);
    const firebasePrefix = firebaseConfig.messagingSenderId;
    if (
      webPrefix &&
      iosPrefix &&
      webPrefix !== iosPrefix &&
      firebasePrefix &&
      webPrefix === firebasePrefix &&
      iosPrefix !== firebasePrefix
    ) {
      issues.push({
        id: 'google-ios-project-mismatch',
        severity: 'warning',
        title: 'Clients Google différents',
        detail:
          'Le client iOS ne semble pas appartenir au même projet Firebase que le client Web. Créez un client iOS dans le projet proday-155b0.',
      });
    }
  }

  return issues;
}

export function hasBlockingConfigIssues(): boolean {
  return getAppConfigIssues().some((i) => i.severity === 'error');
}

export function getConfigSummary(): string {
  const issues = getAppConfigIssues();
  if (issues.length === 0) {
    return `ProDay · ${firebaseConfig.projectId ?? 'ok'}`;
  }
  return issues.map((i) => i.title).join(' · ');
}
