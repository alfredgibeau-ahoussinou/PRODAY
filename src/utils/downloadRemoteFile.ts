import { Linking, Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

function safeFileName(name: string, fallback = 'document.pdf'): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/[^\w.\-àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]+/gi, '_').slice(0, 180);
}

/**
 * Télécharge un fichier distant (PDF / image Storage) pour l’admin.
 * Web : déclenche un download navigateur. Native : cache local + feuille Partager.
 */
export async function downloadRemoteFile(
  url: string,
  fileName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const href = url.trim();
  if (!/^https:\/\//i.test(href)) {
    return { ok: false, error: 'URL fichier invalide' };
  }
  const name = safeFileName(fileName);

  try {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        const a = document.createElement('a');
        a.href = href;
        a.download = name;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return { ok: true };
      }
      const opened = await Linking.openURL(href);
      return opened ? { ok: true } : { ok: false, error: 'Ouverture impossible' };
    }

    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      const opened = await Linking.openURL(href);
      return opened ? { ok: true } : { ok: false, error: 'Cache indisponible' };
    }

    const dest = `${cacheDir}admin_doc_${Date.now()}_${name}`;
    const downloaded = await FileSystem.downloadAsync(href, dest);
    if (!downloaded?.uri) {
      return { ok: false, error: 'Téléchargement échoué' };
    }

    await Share.share({
      url: downloaded.uri,
      title: name,
      message: Platform.OS === 'android' ? name : undefined,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Téléchargement impossible';
    try {
      await Linking.openURL(href);
      return { ok: true };
    } catch {
      return { ok: false, error: msg };
    }
  }
}
