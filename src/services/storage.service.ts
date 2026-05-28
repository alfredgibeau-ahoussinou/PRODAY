import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import { getFirebaseStorage } from '../lib/firebase';

export interface UploadFileInput {
  uri: string;
  mimeType: string;
}

function extensionForMime(mimeType: string): string {
  const mime = mimeType.toLowerCase();
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('png')) return 'png';
  if (mime.includes('heic') || mime.includes('heif')) return 'heic';
  return 'jpg';
}

/** Normalise le MIME pour Storage (règles + compatibilité iOS HEIC). */
export function normalizeImageMimeType(mimeType?: string | null): string {
  const mime = (mimeType ?? '').toLowerCase();
  if (!mime || mime === 'image/jpg') return 'image/jpeg';
  if (mime.startsWith('image/')) return mime;
  return 'image/jpeg';
}

async function uriToBlob(uri: string, mimeType: string): Promise<Blob> {
  // React Native : fetch(file://) est peu fiable — FileSystem en priorité
  if (Platform.OS !== 'web' && uri.startsWith('file://')) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Impossible de lire le fichier sélectionné');
  }
  return response.blob();
}

export type ProfileMediaFolder = 'avatars' | 'gallery';

export const storageService = {
  async uploadProfileImage(
    uid: string,
    file: UploadFileInput,
    folder: ProfileMediaFolder
  ): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error(
        'Firebase Storage non configuré. Renseignez EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET dans .env et activez Storage dans la console Firebase (Build → Storage → Commencer).'
      );
    }

    const contentType = normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `${folder}/${uid}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);

    try {
      const blob = await uriToBlob(file.uri, contentType);
      await uploadBytes(storageRef, blob, { contentType });
      return getDownloadURL(storageRef);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('storage/unauthorized') || msg.includes('403')) {
        throw new Error(
          'Accès Storage refusé. Vérifiez que Firebase Storage est activé sur le projet et que les règles sont déployées (firebase deploy --only storage).'
        );
      }
      if (msg.includes('storage/unknown') || msg.includes('404')) {
        throw new Error(
          'Firebase Storage n’est pas activé. Console Firebase → Storage → Commencer, puis relancez l’app.'
        );
      }
      throw error instanceof Error ? error : new Error(msg);
    }
  },

  async uploadUserDocument(
    uid: string,
    file: UploadFileInput,
    documentType: string
  ): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error(
        'Firebase Storage non configuré. Voir docs/FIREBASE_SETUP.md (section Storage).'
      );
    }

    const contentType = file.mimeType.includes('pdf')
      ? 'application/pdf'
      : normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `documents/${uid}/${documentType}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);

    const blob = await uriToBlob(file.uri, contentType);
    await uploadBytes(storageRef, blob, { contentType });
    return getDownloadURL(storageRef);
  },

  async uploadFeedImage(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour le fil d’actualité.');
    }
    const contentType = normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `feed/${uid}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const blob = await uriToBlob(file.uri, contentType);
    await uploadBytes(storageRef, blob, { contentType });
    return getDownloadURL(storageRef);
  },
};
