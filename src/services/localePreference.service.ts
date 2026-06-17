import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceLanguageTag, resolveSupportedLocale } from '../i18n/localeCatalog';

const GLOBAL_LOCALE_KEY = 'proday_locale_v1';

function userLocaleKey(uid: string) {
  return `${GLOBAL_LOCALE_KEY}:${uid}`;
}

export async function getStoredLocale(uid?: string | null): Promise<string | null> {
  try {
    if (uid) {
      const userValue = await AsyncStorage.getItem(userLocaleKey(uid));
      if (userValue) return userValue;
    }
    return await AsyncStorage.getItem(GLOBAL_LOCALE_KEY);
  } catch {
    return null;
  }
}

export async function getInitialLocale(uid?: string | null): Promise<string> {
  const stored = await getStoredLocale(uid);
  if (stored) return resolveSupportedLocale(stored);
  return getDeviceLanguageTag();
}

export async function setStoredLocale(locale: string, uid?: string | null): Promise<void> {
  const value = resolveSupportedLocale(locale);
  await AsyncStorage.setItem(GLOBAL_LOCALE_KEY, value);
  if (uid) {
    await AsyncStorage.setItem(userLocaleKey(uid), value);
  }
}
