import { Platform } from 'react-native';

/** Identifiants OAuth Google (console Google Cloud / Firebase). */
export const googleOAuth = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
} as const;

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
 * iOS exige `iosClientId` — on retombe sur le Web client ID si besoin (dev / Expo Go).
 */
export function getGoogleAuthRequestConfig(): GoogleAuthRequestConfig | null {
  const web = emptyToUndefined(googleOAuth.webClientId);
  const iosExplicit = emptyToUndefined(googleOAuth.iosClientId);
  const expo = emptyToUndefined(googleOAuth.expoClientId);
  const androidExplicit = emptyToUndefined(googleOAuth.androidClientId);

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
  if (Platform.OS === 'ios') {
    return 'Ajoutez dans .env au minimum EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID et EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (client OAuth iOS, bundle com.proday.app). Voir docs/FIREBASE_SETUP.md';
  }
  if (Platform.OS === 'android') {
    return 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID et EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID dans .env. Voir docs/FIREBASE_SETUP.md';
  }
  return 'Ajoutez EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID dans .env. Voir docs/FIREBASE_SETUP.md';
}
