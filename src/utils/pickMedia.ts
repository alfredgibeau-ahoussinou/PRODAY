import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import type { UploadFileInput } from '../services/storage.service';
import { normalizeImageMimeType } from '../services/storage.service';

export async function pickProfileImage(): Promise<UploadFileInput | null> {
  return pickImageFromLibrary({ allowsEditing: true, aspect: [1, 1] });
}

export async function pickGalleryImage(): Promise<UploadFileInput | null> {
  return pickImageFromLibrary({ allowsEditing: false });
}

async function pickImageFromLibrary(options: {
  allowsEditing: boolean;
  aspect?: [number, number];
}): Promise<UploadFileInput | null> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'Autorisez l’accès à vos photos pour mettre à jour votre profil.'
      );
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: options.allowsEditing,
    aspect: options.aspect,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: normalizeImageMimeType(asset.mimeType),
  };
}
