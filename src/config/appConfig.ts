import {
  isFirebaseConfigured,
  isFirebaseStorageConfigured,
  firebaseConfig,
} from './firebase';

const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';

export type ConfigSeverity = 'error' | 'warning';

export interface ConfigIssue {
  id: string;
  severity: ConfigSeverity;
  title: string;
  detail: string;
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

  if (isProduction && !process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim()) {
    issues.push({
      id: 'eas-missing',
      severity: 'warning',
      title: 'Push notifications',
      detail:
        'EXPO_PUBLIC_EAS_PROJECT_ID manquant — les notifications push ne fonctionneront pas en build natif.',
    });
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
