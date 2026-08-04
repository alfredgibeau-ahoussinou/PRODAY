import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import type { UploadFileInput } from '../services/storage.service';

/** Clip embarqué pour Maestro / smoke publish (pas de Photos). */
const DEMO_REEL_VIDEO = require('../../assets/intro/clips/player-dribbling.mp4');

function toUploadFile(asset: ImagePicker.ImagePickerAsset): UploadFileInput {
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'video/mp4',
  };
}

export async function pickReelVideo(): Promise<UploadFileInput | null> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l’accès à vos vidéos pour publier un reel.');
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: true,
    videoMaxDuration: 60,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return toUploadFile(result.assets[0]);
}

/** Caméra système (selfie / filmage) — dispo sans module ExpoCamera natif. */
export async function recordReelVideo(): Promise<UploadFileInput | null> {
  if (Platform.OS === 'web') {
    Alert.alert('Caméra', 'La caméra live n’est pas disponible sur le web. Utilisez la galerie.');
    return null;
  }

  const cam = await ImagePicker.requestCameraPermissionsAsync();
  if (cam.status !== 'granted') {
    Alert.alert('Permission requise', 'Autorisez la caméra pour filmer votre réel.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    allowsEditing: true,
    videoMaxDuration: 60,
    quality: 0.85,
    cameraType: ImagePicker.CameraType.front,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return toUploadFile(result.assets[0]);
}

/** Résout une vidéo locale du bundle — utilisé par le bouton démo E2E (__DEV__). */
export async function pickDemoReelVideo(): Promise<UploadFileInput | null> {
  const asset = Asset.fromModule(DEMO_REEL_VIDEO);
  await asset.downloadAsync();
  const sourceUri = asset.localUri ?? asset.uri;
  if (!sourceUri) return null;

  const cacheDir = FileSystem.cacheDirectory;
  if (cacheDir && !sourceUri.startsWith(cacheDir)) {
    const dest = `${cacheDir}maestro-demo-reel.mp4`;
    try {
      const info = await FileSystem.getInfoAsync(dest);
      if (!info.exists) {
        await FileSystem.copyAsync({ from: sourceUri, to: dest });
      }
      return { uri: dest, mimeType: 'video/mp4' };
    } catch {
      // fallback source
    }
  }

  return { uri: sourceUri, mimeType: 'video/mp4' };
}
