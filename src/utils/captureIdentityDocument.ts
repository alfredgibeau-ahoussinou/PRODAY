import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { normalizeImageMimeType } from '../services/storage.service';

export type DocumentCaptureKind = 'identity' | 'document';

export interface CapturedDocumentPhoto {
  uri: string;
  mimeType: string;
}

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === 'granted') return true;

  Alert.alert(
    'Caméra requise',
    'Autorisez l’accès à la caméra pour photographier votre pièce d’identité ou passeport.'
  );
  return false;
}

/**
 * Ouvre la caméra pour capturer un justificatif (CNI, passeport, licence…).
 * Aucun fichier n’est stocké localement au-delà du cache temporaire Expo.
 */
export async function captureDocumentWithCamera(
  kind: DocumentCaptureKind = 'identity'
): Promise<CapturedDocumentPhoto | null> {
  const allowed = await ensureCameraPermission();
  if (!allowed) return null;

  const aspect: [number, number] = kind === 'identity' ? [3, 2] : [4, 3];

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
    exif: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: normalizeImageMimeType(asset.mimeType ?? 'image/jpeg'),
  };
}
