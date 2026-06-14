import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricCapability = {
  available: boolean;
  enrolled: boolean;
  label: string;
};

/** Capacités biométriques de l'appareil (no-op web). */
export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (Platform.OS === 'web') {
    return { available: false, enrolled: false, label: 'Biométrie' };
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  const types = hasHardware
    ? await LocalAuthentication.supportedAuthenticationTypesAsync()
    : [];

  let label = 'Biométrie';
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    label = Platform.OS === 'ios' ? 'Face ID' : 'Reconnaissance faciale';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    label = Platform.OS === 'ios' ? 'Touch ID' : 'Empreinte digitale';
  }

  return { available: hasHardware, enrolled, label };
}

/** Demande l'authentification biométrique locale. */
export async function promptBiometricAuth(
  promptMessage = 'Connexion à ProDay'
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Annuler',
    disableDeviceFallback: false,
    fallbackLabel: 'Code appareil',
  });

  return result.success;
}
