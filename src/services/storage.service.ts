import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
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

type UploadPayload =
  | { kind: 'base64'; base64: string }
  | { kind: 'blob'; blob: Blob };

function isLocalDeviceUri(uri: string): boolean {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

async function readFileForUpload(uri: string): Promise<UploadPayload> {
  // React Native : pas de Blob(ArrayBuffer) — base64 + uploadString
  if (Platform.OS !== 'web' && isLocalDeviceUri(uri)) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    return { kind: 'base64', base64 };
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Impossible de lire le fichier sélectionné');
  }
  return { kind: 'blob', blob: await response.blob() };
}

async function uploadPayload(
  storageRef: ReturnType<typeof ref>,
  payload: UploadPayload,
  contentType: string
): Promise<void> {
  if (payload.kind === 'base64') {
    await uploadString(storageRef, payload.base64, 'base64', { contentType });
    return;
  }
  await uploadBytes(storageRef, payload.blob, { contentType });
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
      const payload = await readFileForUpload(file.uri);
      await uploadPayload(storageRef, payload, contentType);
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

    const payload = await readFileForUpload(file.uri);
    await uploadPayload(storageRef, payload, contentType);
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
    const payload = await readFileForUpload(file.uri);
    await uploadPayload(storageRef, payload, contentType);
    return getDownloadURL(storageRef);
  },

  async uploadProfileHighlightVideo(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les vidéos highlight.');
    }
    const contentType = file.mimeType.includes('video') ? file.mimeType : 'video/mp4';
    const path = `highlights/${uid}/${Date.now()}.mp4`;
    const storageRef = ref(storage, path);
    const payload = await readFileForUpload(file.uri);
    await uploadPayload(storageRef, payload, contentType);
    return getDownloadURL(storageRef);
  },

  async uploadActivityThumbnail(uid: string, activityId: string, localUri: string): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les miniatures activité.');
    }
    const contentType = 'image/jpeg';
    const path = `player_activity_thumbnails/${uid}/${activityId}.jpg`;
    const storageRef = ref(storage, path);
    const payload = await readFileForUpload(localUri);
    await uploadPayload(storageRef, payload, contentType);
    return getDownloadURL(storageRef);
  },

  async uploadCommunityReel(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les reels.');
    }
    const contentType = file.mimeType.includes('video') ? file.mimeType : 'video/mp4';
    const path = `community_reels/${uid}/${Date.now()}.mp4`;
    const storageRef = ref(storage, path);
    const payload = await readFileForUpload(file.uri);
    await uploadPayload(storageRef, payload, contentType);
    return getDownloadURL(storageRef);
  },
};
