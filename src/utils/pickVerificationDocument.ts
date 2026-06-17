import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { captureDocumentWithCamera } from './captureIdentityDocument';
import { normalizeImageMimeType } from '../services/storage.service';

export type VerificationFileSource = 'camera' | 'library' | 'file';

export interface PickedVerificationFile {
  uri: string;
  mimeType: string;
  source: VerificationFileSource;
}

export async function pickVerificationFromCamera(
  kind: 'identity' | 'document' = 'identity'
): Promise<PickedVerificationFile | null> {
  const photo = await captureDocumentWithCamera(kind === 'identity' ? 'identity' : 'document');
  if (!photo) return null;
  return { ...photo, source: 'camera' };
}

export async function pickVerificationFromGallery(): Promise<PickedVerificationFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: normalizeImageMimeType(asset.mimeType ?? 'image/jpeg'),
    source: 'library',
  };
}

export async function pickVerificationPdf(): Promise<PickedVerificationFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'application/pdf',
    source: 'file',
  };
}

/** @deprecated Préférer les boutons explicites caméra / galerie / PDF. */
export async function pickVerificationDocument(
  kind: 'identity' | 'document' = 'identity'
): Promise<PickedVerificationFile | null> {
  return pickVerificationFromGallery();
}
