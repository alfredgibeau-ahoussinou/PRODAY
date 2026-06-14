import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Identifiants OAuth Google (console Google Cloud / Firebase). */
export const googleOAuth = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
} as const;

/** App lancée dans Expo Go (redirect `exp://`, pas le schéma natif). */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/**
 * Google OAuth ne fonctionne pas dans Expo Go : Google refuse les URI `exp://`.
 * Il faut un development build (`npx expo run:ios` ou EAS).
 */
export function getGoogleSignInBlockReason(): string | null {
  if (!isExpoGo()) return null;
  return 'La connexion Google ne fonctionne pas dans Expo Go (Google refuse les redirections exp://). Installez un development build : npx expo run:ios (simulateur ou iPhone) ou eas build --profile development. Voir docs/FIREBASE_SETUP.md';
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export type GoogleAuthRequestConfig = {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
};

/**
 * Config Google valide pour la plateforme courante.
 * - **Expo Go** : redirect `exp://` → client Web obligatoire (pas le client iOS `com.proday.app`).
 * - **Dev build / store** : clients natifs iOS / Android + Web client pour Firebase.
 */
export function getGoogleAuthRequestConfig(): GoogleAuthRequestConfig | null {
  const web = emptyToUndefined(googleOAuth.webClientId);
  const iosExplicit = emptyToUndefined(googleOAuth.iosClientId);
  const expo = emptyToUndefined(googleOAuth.expoClientId);
  const androidExplicit = emptyToUndefined(googleOAuth.androidClientId);

  if (isExpoGo()) {
    return null;
  }

  const ios = iosExplicit ?? expo ?? web;
  const android = androidExplicit ?? web;

  if (Platform.OS === 'ios') {
    if (!ios) return null;
    return { webClientId: web, iosClientId: ios, androidClientId: android };
  }
  if (Platform.OS === 'android') {
    if (!android) return null;
    return { webClientId: web, iosClientId: ios, androidClientId: android };
  }
  if (!web) return null;
  return { webClientId: web, iosClientId: ios, androidClientId: android };
}

export function isGoogleAuthConfigured(): boolean {
  return getGoogleAuthRequestConfig() !== null;
}

/** Message d’aide si la connexion Google n’est pas prête. */
export function getGoogleAuthSetupHint(): string {
  if (isExpoGo()) {
    return getGoogleSignInBlockReason() ?? 'Utilisez un development build pour Google Sign-In.';
  }
  if (Platform.OS === 'ios') {
    return 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dans .env (obligatoire). EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID est recommandé pour le dev build ; le client Web peut servir de secours. Voir docs/FIREBASE_SETUP.md';
  }
  if (Platform.OS === 'android') {
    return 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID et EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID dans .env. Voir docs/FIREBASE_SETUP.md';
  }
  return 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dans .env. Voir docs/FIREBASE_SETUP.md';
}
