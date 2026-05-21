import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '../lib/firebase';

export interface UploadFileInput {
  uri: string;
  mimeType: string;
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('png')) return 'png';
  return 'jpg';
}

export const storageService = {
  async uploadUserDocument(
    uid: string,
    file: UploadFileInput,
    documentType: string
  ): Promise<string> {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage non configuré (EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET)');
    }

    const ext = extensionForMime(file.mimeType);
    const path = `documents/${uid}/${documentType}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);

    const response = await fetch(file.uri);
    if (!response.ok) {
      throw new Error('Impossible de lire le fichier sélectionné');
    }
    const blob = await response.blob();

    await uploadBytes(storageRef, blob, { contentType: file.mimeType });
    return getDownloadURL(storageRef);
  },
};
