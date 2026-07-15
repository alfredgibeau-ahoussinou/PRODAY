import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

function readGoogleOAuth() {
  return {
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  } as const;
}

/** Identifiants OAuth Google (console Google Cloud / Firebase) — lecture à l'appel. */
export function getGoogleOAuthEnv() {
  return readGoogleOAuth();
}

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
 * Ne jamais réutiliser le client **Web** comme client iOS/Android : Google refuse
 * les URI custom scheme (`proday://`) pour le type WEB → erreur 400 invalid_request.
 */
export function getGoogleAuthRequestConfig(): GoogleAuthRequestConfig | null {
  const googleOAuth = readGoogleOAuth();
  const web = emptyToUndefined(googleOAuth.webClientId);
  const ios = emptyToUndefined(googleOAuth.iosClientId) ?? emptyToUndefined(googleOAuth.expoClientId);
  const android = emptyToUndefined(googleOAuth.androidClientId);

  if (isExpoGo()) {
    return null;
  }

  if (Platform.OS === 'ios') {
    if (!ios || !web) return null;
    return { webClientId: web, iosClientId: ios, androidClientId: android };
  }
  if (Platform.OS === 'android') {
    if (!android || !web) return null;
    return { webClientId: web, iosClientId: ios, androidClientId: android };
  }
  if (!web) return null;
  return { webClientId: web, iosClientId: ios, androidClientId: android };
}

export function isGoogleAuthConfigured(): boolean {
  return getGoogleAuthRequestConfig() !== null;
}

/** Redirect natif Google iOS (`reversed client id:/oauthredirect`). */
export function getGoogleIosRedirectUri(iosClientId: string): string {
  const guid = iosClientId
    .trim()
    .replace(/\.apps\.googleusercontent\.com$/i, '');
  return `com.googleusercontent.apps.${guid}:/oauthredirect`;
}

/** Schéma URL à déclarer dans Info.plist pour le client iOS. */
export function getGoogleIosUrlScheme(iosClientId: string): string {
  const guid = iosClientId
    .trim()
    .replace(/\.apps\.googleusercontent\.com$/i, '');
  return `com.googleusercontent.apps.${guid}`;
}

/** Message d’aide si la connexion Google n’est pas prête. */
export function getGoogleAuthSetupHint(): string {
  if (isExpoGo()) {
    return getGoogleSignInBlockReason() ?? 'Utilisez un development build pour Google Sign-In.';
  }
  if (Platform.OS === 'ios') {
    return 'Ajoutez EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (type OAuth « iOS », bundle com.proday.app) et EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dans .env. Le client Web seul provoque l’erreur « Custom scheme URIs are not allowed for WEB client type ». Voir docs/FIREBASE_SETUP.md';
  }
  if (Platform.OS === 'android') {
    return 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID et EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (type OAuth Android) dans .env. Voir docs/FIREBASE_SETUP.md';
  }
  return 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dans .env. Voir docs/FIREBASE_SETUP.md';
}
