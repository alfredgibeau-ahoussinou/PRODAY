import { Alert, type AlertButton } from 'react-native';
import { getErrorMessage } from './errors';

/** Alertes natives — titres et libellés cohérents ProDay. */
export const appAlerts = {
  error(title: string, error: unknown, fallback?: string) {
    Alert.alert(title, getErrorMessage(error, fallback));
  },

  success(title: string, message: string) {
    Alert.alert(title, message);
  },

  confirm(
    title: string,
    message: string,
    buttons: AlertButton[]
  ) {
    Alert.alert(title, message, buttons);
  },

  info(title: string, message: string) {
    Alert.alert(title, message);
  },
};
