import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MessageCatalog } from '../i18n/types';

const CACHE_PREFIX = 'proday_ui_catalog_v1:';

export async function getCachedUiCatalog(localeBase: string): Promise<MessageCatalog | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${localeBase}`);
    if (!raw) return null;
    return JSON.parse(raw) as MessageCatalog;
  } catch {
    return null;
  }
}

export async function setCachedUiCatalog(localeBase: string, catalog: MessageCatalog): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${localeBase}`, JSON.stringify(catalog));
  } catch {
    /* quota / stockage */
  }
}

export async function clearUiCatalogCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (ours.length) await AsyncStorage.multiRemove(ours);
  } catch {
    /* ignore */
  }
}
