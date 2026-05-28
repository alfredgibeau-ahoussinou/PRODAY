import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import type { UploadFileInput } from '../services/storage.service';
import { normalizeImageMimeType } from '../services/storage.service';

export async function pickFeedImage(): Promise<UploadFileInput | null> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l’accès à vos photos pour publier une image.');
      return null;
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.82,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: normalizeImageMimeType(asset.mimeType),
  };
}
