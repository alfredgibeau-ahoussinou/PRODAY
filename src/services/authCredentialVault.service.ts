import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMEMBER_EMAIL_KEY = 'proday:auth-remember-email';
const BIOMETRIC_ENABLED_KEY = 'proday:auth-biometric-enabled';
const VAULT_KEY = 'proday:auth-vault';

import {
  maskEmail,
  parseSavedCredentials,
  type SavedCredentials,
} from '../utils/authCredentialHelpers';

export type { SavedCredentials };
export { maskEmail, parseSavedCredentials };

export async function loadRememberedEmail(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function saveRememberedEmail(email: string | null): Promise<void> {
  if (!email?.trim()) {
    await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
    return;
  }
  await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  if (enabled) {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, '1');
  } else {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await clearVaultCredentials();
  }
}

export async function saveVaultCredentials(creds: SavedCredentials): Promise<void> {
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(VAULT_KEY, JSON.stringify(creds), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: true,
  });
}

export async function loadVaultCredentials(): Promise<SavedCredentials | null> {
  if (Platform.OS === 'web') return null;
  try {
    const raw = await SecureStore.getItemAsync(VAULT_KEY);
    return parseSavedCredentials(raw);
  } catch {
    return null;
  }
}

export async function clearVaultCredentials(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.deleteItemAsync(VAULT_KEY);
  } catch {
    /* keychain indisponible */
  }
}

export async function clearAllSavedAuth(): Promise<void> {
  await saveRememberedEmail(null);
  await setBiometricLoginEnabled(false);
}
