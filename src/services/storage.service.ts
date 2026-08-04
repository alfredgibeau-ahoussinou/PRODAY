import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';
import { firebaseConfig } from '../config/firebase';
import { getFirebaseAuth, getFirebaseStorage } from '../lib/firebase';

export interface UploadFileInput {
  uri: string;
  mimeType: string;
}

const UPLOAD_LOG_PREFIX = '[storage.upload]';

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

/** Normalise les MIME vidéo pour matcher strictement les règles Storage. */
export function normalizeVideoMimeType(mimeType?: string | null): string {
  const raw = (mimeType ?? '').toLowerCase().trim();
  if (!raw) return 'video/mp4';
  if (raw.includes('quicktime') || raw.includes('mov')) return 'video/quicktime';
  if (raw.includes('webm')) return 'video/webm';
  if (raw.includes('mp4') || raw.includes('mpeg') || raw.includes('m4v')) return 'video/mp4';
  if (raw.startsWith('video/')) return 'video/mp4';
  return 'video/mp4';
}

function isRemoteUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function isArrayBufferBlobError(message: string): boolean {
  return message.includes('ArrayBuffer') || message.includes('ArrayBufferView');
}

function logUploadTrigger(objectPath: string, sourceUri: string, trigger: string): void {
  if (__DEV__) {
    console.log(
      `${UPLOAD_LOG_PREFIX} trigger=${trigger} path=${objectPath} uri=${sourceUri.slice(0, 96)}`
    );
  }
}

/** Télécharge une URL distante en cache local si nécessaire. */
export async function resolveLocalFileUriForUpload(uri: string): Promise<string> {
  if (!isRemoteUri(uri)) return uri;

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('Cache indisponible pour télécharger le fichier');
  }
  const downloaded = await FileSystem.downloadAsync(uri, `${cacheDir}upload_${Date.now()}`);
  return downloaded.uri;
}

/** Lit un fichier local ou distant en base64 (React Native — jamais fetch().blob()). */
export async function readFileAsBase64ForUpload(uri: string): Promise<string> {
  const readUri = await resolveLocalFileUriForUpload(uri);
  return FileSystem.readAsStringAsync(readUri, { encoding: 'base64' });
}

/**
 * Upload natif via REST Firebase + expo-file-system.
 * Contourne uploadString/uploadBytes du SDK JS qui appellent new Blob([Uint8Array]) — non supporté sur RN.
 */
async function uploadNativeFileViaRest(
  storageRef: ReturnType<typeof ref>,
  localUri: string,
  contentType: string,
  trigger: string
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('Connexion requise pour envoyer un fichier.');
  }

  const bucket = firebaseConfig.storageBucket?.trim();
  if (!bucket) {
    throw new Error('Firebase Storage non configuré.');
  }

  const objectPath = storageRef.fullPath;
  logUploadTrigger(objectPath, localUri, trigger);

  const token = await user.getIdToken();
  const uploadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o` +
    `?uploadType=media&name=${encodeURIComponent(objectPath)}`;

  const doUpload = async (authorizationValue: string) =>
    FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: authorizationValue,
        'Content-Type': contentType,
      },
    });

  // Firebase Storage REST accepte classiquement "Firebase <idToken>".
  // Sur certains environnements, "Bearer <token>" peut aussi fonctionner.
  let result = await doUpload(`Firebase ${token}`);
  const firstBody = result.body?.slice(0, 240) ?? '';
  const shouldRetryWithBearer =
    (result.status === 401 || result.status === 403) &&
    (firstBody.includes('Unauth') ||
      firstBody.includes('auth') ||
      firstBody.includes('token') ||
      firstBody.includes('storage/unauthorized'));

  if (shouldRetryWithBearer) {
    result = await doUpload(`Bearer ${token}`);
  }

  if (result.status >= 200 && result.status < 300) return;

  const bodyPreview = result.body?.slice(0, 240) ?? '';
  if (result.status === 403 || bodyPreview.includes('storage/unauthorized')) {
    throw new Error(
      'Accès Storage refusé. Vérifiez la session utilisateur, puis que Firebase Storage est activé et les règles déployées (firebase deploy --only storage).'
    );
  }
  if (result.status === 404 || bodyPreview.includes('storage/unknown')) {
    throw new Error(
      'Firebase Storage n’est pas activé. Console Firebase → Storage → Commencer, puis relancez l’app.'
    );
  }
  throw new Error(
    `Upload Storage échoué (${result.status})${bodyPreview ? `: ${bodyPreview}` : ''}`
  );
}

async function uploadWebBlob(
  storageRef: ReturnType<typeof ref>,
  uri: string,
  contentType: string
): Promise<void> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Impossible de lire le fichier sélectionné');
  }
  try {
    await uploadBytes(storageRef, await response.blob(), { contentType });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (isArrayBufferBlobError(msg)) {
      throw new Error(
        'Envoi impossible : le navigateur ne peut pas préparer ce fichier. Réessayez avec une autre image.'
      );
    }
    throw error;
  }
}

async function uploadFileToStorageRef(
  storageRef: ReturnType<typeof ref>,
  sourceUri: string,
  contentType: string,
  trigger: string
): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      const localUri = await resolveLocalFileUriForUpload(sourceUri);
      await uploadNativeFileViaRest(storageRef, localUri, contentType, trigger);
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isArrayBufferBlobError(msg)) {
        throw new Error(
          'Envoi impossible sur mobile (format fichier non supporté). Choisissez une autre photo.'
        );
      }
      throw error instanceof Error ? error : new Error(msg);
    }
  }

  await uploadWebBlob(storageRef, sourceUri, contentType);
}

function mapStorageUploadError(error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('storage/unauthorized') || msg.includes('403')) {
    return new Error(
      'Accès Storage refusé. Vérifiez la session utilisateur, puis que Firebase Storage est activé et les règles déployées (firebase deploy --only storage).'
    );
  }
  if (msg.includes('storage/unknown') || msg.includes('404')) {
    return new Error(
      'Firebase Storage n’est pas activé. Console Firebase → Storage → Commencer, puis relancez l’app.'
    );
  }
  return error instanceof Error ? error : new Error(msg);
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
      await uploadFileToStorageRef(storageRef, file.uri, contentType, `profile-image:${folder}`);
      return getDownloadURL(storageRef);
    } catch (error) {
      throw mapStorageUploadError(error);
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

    await uploadFileToStorageRef(storageRef, file.uri, contentType, `document:${documentType}`);
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
    await uploadFileToStorageRef(storageRef, file.uri, contentType, 'feed-image');
    return getDownloadURL(storageRef);
  },

  async uploadProfileHighlightVideo(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les vidéos highlight.');
    }
    const contentType = normalizeVideoMimeType(file.mimeType);
    const path = `highlights/${uid}/${Date.now()}.mp4`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, file.uri, contentType, 'highlight-video');
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
    await uploadFileToStorageRef(storageRef, localUri, contentType, 'activity-thumbnail');
    return getDownloadURL(storageRef);
  },

  async uploadVoiceReflection(uid: string, activityId: string, localUri: string): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les réflexions vocales.');
    }
    const contentType = 'audio/m4a';
    const path = `voice_reflections/${uid}/${activityId}-${Date.now()}.m4a`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, localUri, contentType, 'voice-reflection');
    return getDownloadURL(storageRef);
  },

  async uploadCommunityReel(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les reels.');
    }
    const contentType = normalizeVideoMimeType(file.mimeType);
    const path = `community_reels/${uid}/${Date.now()}.mp4`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, file.uri, contentType, 'community-reel');
    return getDownloadURL(storageRef);
  },
};
