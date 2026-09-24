import 'react-native-get-random-values';
import 'react-native-reanimated';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// expo-notifications lit le Keychain au boot ; sur certains builds iOS
// (entitlements / profils) ça log une erreur non fatale qui ouvre le LogBox.
if (__DEV__) {
  LogBox.ignoreLogs([
    'Error reading persisted server registration info',
    '[expo-notifications] Error reading persisted server registration info',
    'Failed to assemble ui_config',
    'LogOut was called but the current user is anonymous',
  ]);
}

registerRootComponent(App);
