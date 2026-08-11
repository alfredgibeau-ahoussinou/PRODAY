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
  if (mime.includes('quicktime') || mime.includes('mov')) return 'mov';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mp4') || mime.includes('mpeg') || mime.includes('m4v') || mime.startsWith('video/')) {
    return 'mp4';
  }
  if (mime.startsWith('audio/')) return 'm4a';
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

function isIosBackgroundUploadError(message: string): boolean {
  return (
    message.includes('NSURLErrorDomain') ||
    message.includes('BackgroundUploadTask') ||
    message.includes('Unable to upload the file') ||
    message.includes('Lost connection to background transfer')
  );
}

function cleanMime(contentType: string): string {
  return contentType.split(';')[0].trim() || contentType;
}

function uint8FromBase64(base64: string): Uint8Array {
  const atobFn = globalThis.atob;
  if (typeof atobFn !== 'function') {
    throw new Error('Décodage base64 indisponible sur cet appareil.');
  }
  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Lit un fichier local en octets — sans `new Blob([Uint8Array])` (cassé sur RN). */
async function readLocalFileAsUint8Array(uri: string): Promise<Uint8Array> {
  try {
    const res = await fetch(uri);
    if (res.ok && typeof res.arrayBuffer === 'function') {
      return new Uint8Array(await res.arrayBuffer());
    }
  } catch {
    /* fallback base64 */
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  return uint8FromBase64(base64);
}

/**
 * Upload via SDK Firebase (auth ID token attaché automatiquement).
 * Plus fiable que REST manuel qui renvoie souvent 403 Permission denied sur iOS.
 */
async function uploadNativeFileViaSdk(
  storageRef: ReturnType<typeof ref>,
  localUri: string,
  contentType: string,
  trigger: string
): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) {
    throw new Error('Connexion requise pour envoyer un fichier.');
  }
  const cleanContentType = cleanMime(contentType);
  logUploadTrigger(storageRef.fullPath, localUri, `${trigger}:sdk`);
  const bytes = await readLocalFileAsUint8Array(localUri);
  await uploadBytes(storageRef, bytes, { contentType: cleanContentType });
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

/**
 * Copie vers un fichier stable dans le cache app.
 * Évite ph:// / tmp ImagePicker / content:// qui cassent souvent BackgroundUploadTask iOS.
 */
async function materializeStableUploadUri(
  sourceUri: string,
  contentType: string
): Promise<{ uri: string; cleanup: () => Promise<void> }> {
  const localUri = await resolveLocalFileUriForUpload(sourceUri);
  const cacheDir = FileSystem.cacheDirectory;
  const noop = async () => undefined;

  if (!cacheDir) {
    return { uri: localUri, cleanup: noop };
  }

  const alreadyStable =
    localUri.startsWith(cacheDir) &&
    (localUri.startsWith('file://') || localUri.startsWith('/'));

  const fragileScheme =
    localUri.startsWith('ph://') ||
    localUri.startsWith('assets-library://') ||
    localUri.startsWith('content://') ||
    localUri.includes('/tmp/') ||
    localUri.includes('/Caches/ImagePicker/') ||
    localUri.includes('/Containers/Data/Application/');

  // iOS : toujours matérialiser (BackgroundUploadTask + URI galerie/caméra).
  if (Platform.OS !== 'ios' && alreadyStable && !fragileScheme) {
    return { uri: localUri, cleanup: noop };
  }

  const ext = extensionForMime(contentType);
  const dest = `${cacheDir}upload_stable_${Date.now()}.${ext}`;
  try {
    await FileSystem.copyAsync({ from: localUri, to: dest });
    return {
      uri: dest,
      cleanup: async () => {
        try {
          await FileSystem.deleteAsync(dest, { idempotent: true });
        } catch {
          /* ignore */
        }
      },
    };
  } catch (e) {
    if (__DEV__) {
      console.warn(`${UPLOAD_LOG_PREFIX} copyAsync failed, using source uri`, e);
    }
    return { uri: localUri, cleanup: noop };
  }
}

/** Lit un fichier local ou distant en base64 (React Native — jamais fetch().blob()). */
export async function readFileAsBase64ForUpload(uri: string): Promise<string> {
  const readUri = await resolveLocalFileUriForUpload(uri);
  return FileSystem.readAsStringAsync(readUri, { encoding: 'base64' });
}

/**
 * Upload natif via fetch + REST Firebase (évite BackgroundUploadTask iOS d’uploadAsync).
 */
async function uploadNativeFileViaFetch(
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
  logUploadTrigger(objectPath, localUri, `${trigger}:fetch`);

  const cleanContentType = contentType.split(';')[0].trim() || contentType;
  const fileRes = await fetch(localUri);
  if (!fileRes.ok) {
    throw new Error('Impossible de lire le fichier local pour l’envoi.');
  }
  const body = await fileRes.blob();

  const token = await user.getIdToken(true);
  const uploadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o` +
    `?uploadType=media&name=${encodeURIComponent(objectPath)}`;

  const post = async (authorizationValue: string) =>
    fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: authorizationValue,
        'Content-Type': cleanContentType,
      },
      body,
    });

  let result = await post(`Firebase ${token}`);
  if (result.status === 401 || result.status === 403) {
    result = await post(`Bearer ${token}`);
  }

  if (result.status >= 200 && result.status < 300) return;

  const bodyPreview = (await result.text()).slice(0, 320);
  if (result.status === 403 || bodyPreview.includes('storage/unauthorized')) {
    throw new Error(
      `Accès Storage refusé (${cleanContentType}). Reconnectez-vous, puis vérifiez les règles Storage. ${bodyPreview || 'firebase deploy --only storage'}`
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

/**
 * Upload natif via REST Firebase + expo-file-system.
 * Contourne uploadString/uploadBytes du SDK JS qui appellent new Blob([Uint8Array]) — non supporté sur RN.
 * sessionType FOREGROUND : évite BackgroundUploadTask iOS (NSURLErrorDomain -1 sur vidéos).
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

  const token = await user.getIdToken(true);
  const uploadUrl =
    `https://firebasestorage.googleapis.com/v0/b/${bucket}/o` +
    `?uploadType=media&name=${encodeURIComponent(objectPath)}`;

  // Content-Type strict (sans codecs=) — les règles Storage font un match complet.
  const cleanContentType = contentType.split(';')[0].trim() || contentType;

  const doUpload = async (authorizationValue: string) =>
    FileSystem.uploadAsync(uploadUrl, localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
      headers: {
        Authorization: authorizationValue,
        'Content-Type': cleanContentType,
      },
    });

  // Firebase Storage REST : "Firebase <idToken>" ; retry Bearer si 401/403 auth.
  let result = await doUpload(`Firebase ${token}`);
  if (result.status === 401 || result.status === 403) {
    if (__DEV__) {
      console.warn(
        `${UPLOAD_LOG_PREFIX} first auth failed status=${result.status} body=${(result.body ?? '').slice(0, 180)}`
      );
    }
    result = await doUpload(`Bearer ${token}`);
  }

  if (result.status >= 200 && result.status < 300) return;

  const bodyPreview = result.body?.slice(0, 320) ?? '';
  if (result.status === 403 || bodyPreview.includes('storage/unauthorized')) {
    throw new Error(
      `Accès Storage refusé (${cleanContentType}). Reconnectez-vous, puis vérifiez les règles Storage. ${bodyPreview || 'firebase deploy --only storage'}`
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
    const { uri: stableUri, cleanup } = await materializeStableUploadUri(sourceUri, contentType);
    try {
      // 1) SDK Firebase (auth correcte) — évite les 403 REST « Permission denied »
      try {
        await uploadNativeFileViaSdk(storageRef, stableUri, contentType, trigger);
        return;
      } catch (sdkErr) {
        const sdkMsg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
        if (isArrayBufferBlobError(sdkMsg)) {
          if (__DEV__) {
            console.warn(`${UPLOAD_LOG_PREFIX} SDK Uint8Array path failed, fallback REST`, sdkErr);
          }
        } else if (!sdkMsg.includes('storage/unauthorized') && !sdkMsg.includes('403')) {
          throw sdkErr;
        } else if (__DEV__) {
          console.warn(`${UPLOAD_LOG_PREFIX} SDK unauthorized, fallback REST`, sdkErr);
        }
      }

      const isVideo = contentType.startsWith('video/');
      if (Platform.OS === 'ios' && isVideo) {
        try {
          await uploadNativeFileViaFetch(storageRef, stableUri, contentType, trigger);
          return;
        } catch (fetchErr) {
          if (__DEV__) {
            console.warn(`${UPLOAD_LOG_PREFIX} fetch upload failed, retry uploadAsync`, fetchErr);
          }
        }
      }

      try {
        await uploadNativeFileViaRest(storageRef, stableUri, contentType, trigger);
        return;
      } catch (restErr) {
        const restMsg = restErr instanceof Error ? restErr.message : String(restErr);
        if (isIosBackgroundUploadError(restMsg) || Platform.OS === 'ios') {
          await uploadNativeFileViaFetch(storageRef, stableUri, contentType, trigger);
          return;
        }
        throw restErr;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isArrayBufferBlobError(msg)) {
        throw new Error(
          'Envoi impossible sur mobile (format fichier non supporté). Choisissez une autre photo.'
        );
      }
      if (isIosBackgroundUploadError(msg)) {
        throw new Error(
          'Envoi vidéo interrompu (réseau iOS). Vérifiez le Wi‑Fi / les données, gardez l’app ouverte, puis réessayez avec une vidéo plus courte.'
        );
      }
      throw error instanceof Error ? error : new Error(msg);
    } finally {
      await cleanup();
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
  if (isIosBackgroundUploadError(msg)) {
    return new Error(
      'Envoi vidéo interrompu (réseau iOS). Vérifiez le Wi‑Fi / les données, gardez l’app ouverte, puis réessayez avec une vidéo plus courte.'
    );
  }
  return error instanceof Error ? error : new Error(msg);
}

function requireAuthUid(requestedUid?: string): string {
  const authUid = getFirebaseAuth()?.currentUser?.uid;
  if (!authUid) {
    throw new Error('Connexion requise pour envoyer un fichier.');
  }
  // Les règles Storage exigent request.auth.uid == userId du chemin.
  if (requestedUid && requestedUid !== authUid && __DEV__) {
    console.warn(
      `${UPLOAD_LOG_PREFIX} uid mismatch profile=${requestedUid} auth=${authUid} — using auth uid`
    );
  }
  return authUid;
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

    const ownerUid = requireAuthUid(uid);
    const contentType = normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `${folder}/${ownerUid}/${Date.now()}.${ext}`;
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

    const ownerUid = requireAuthUid(uid);
    const contentType = file.mimeType.includes('pdf')
      ? 'application/pdf'
      : normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `documents/${ownerUid}/${documentType}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);

    await uploadFileToStorageRef(storageRef, file.uri, contentType, `document:${documentType}`);
    return getDownloadURL(storageRef);
  },

  async uploadFeedImage(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour le fil d’actualité.');
    }
    const ownerUid = requireAuthUid(uid);
    const contentType = normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `feed/${ownerUid}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, file.uri, contentType, 'feed-image');
    return getDownloadURL(storageRef);
  },

  async uploadProfileHighlightVideo(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les vidéos highlight.');
    }
    const ownerUid = requireAuthUid(uid);
    const contentType = normalizeVideoMimeType(file.mimeType);
    const path = `highlights/${ownerUid}/${Date.now()}.mp4`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, file.uri, contentType, 'highlight-video');
    return getDownloadURL(storageRef);
  },

  async uploadActivityThumbnail(uid: string, activityId: string, localUri: string): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les miniatures activité.');
    }
    const ownerUid = requireAuthUid(uid);
    const contentType = 'image/jpeg';
    const path = `player_activity_thumbnails/${ownerUid}/${activityId}.jpg`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, localUri, contentType, 'activity-thumbnail');
    return getDownloadURL(storageRef);
  },

  async uploadVoiceReflection(uid: string, activityId: string, localUri: string): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les réflexions vocales.');
    }
    const ownerUid = requireAuthUid(uid);
    const contentType = 'audio/m4a';
    const path = `voice_reflections/${ownerUid}/${activityId}-${Date.now()}.m4a`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, localUri, contentType, 'voice-reflection');
    return getDownloadURL(storageRef);
  },

  async uploadCommunityReel(uid: string, file: UploadFileInput): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré pour les reels.');
    }
    const ownerUid = requireAuthUid(uid);
    const contentType = normalizeVideoMimeType(file.mimeType);
    const path = `community_reels/${ownerUid}/${Date.now()}.mp4`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, file.uri, contentType, 'community-reel');
    return getDownloadURL(storageRef);
  },

  /** Coffre personnel — retourne le path Storage (pas d’URL publique longue durée). */
  async uploadPersonalVaultFile(
    uid: string,
    file: UploadFileInput,
    category: string,
  ): Promise<{ path: string }> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré.');
    }
    const ownerUid = requireAuthUid(uid);
    const contentType = file.mimeType.includes('pdf')
      ? 'application/pdf'
      : normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `personal_vault/${ownerUid}/${category}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, file.uri, contentType, `personal-vault:${category}`);
    return { path };
  },

  /** Coffre médical — path only ; téléchargement via getSensitiveDocumentUrl. */
  async uploadMedicalVaultFile(
    uid: string,
    file: UploadFileInput,
    docType: string,
  ): Promise<{ path: string }> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré.');
    }
    const ownerUid = requireAuthUid(uid);
    const contentType = file.mimeType.includes('pdf')
      ? 'application/pdf'
      : normalizeImageMimeType(file.mimeType);
    const ext = extensionForMime(contentType);
    const path = `medical_vault/${ownerUid}/${docType}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadFileToStorageRef(storageRef, file.uri, contentType, `medical-vault:${docType}`);
    return { path };
  },
};
