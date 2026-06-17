import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import type { UploadFileInput } from '../services/storage.service';

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
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'video/mp4',
  };
}
