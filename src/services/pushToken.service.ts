import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isFirebaseConfigured } from '../config/firebase';
import { profileService } from './profile.service';

/**
 * Enregistre le token push sur le profil (build natif / dev client uniquement).
 * Désactivé sur web et Expo Go pour éviter les crashs HostFunction au démarrage.
 */
export async function registerPushTokenIfPossible(uid: string): Promise<void> {
  if (!isFirebaseConfigured() || Platform.OS === 'web') return;

  // Expo Go : pas de push natif fiable → skip (évite "main has not been registered")
  if (Constants.appOwnership === 'expo') return;

  try {
    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    const token = tokenData.data;
    if (token) {
      await profileService.updateFcmToken(uid, token);
    }
  } catch (e) {
    console.warn('[pushToken] registration skipped:', e);
  }
}
