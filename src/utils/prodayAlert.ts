import { Alert, Platform } from 'react-native';

/**
 * Confirmation inter-plateforme — `Alert.alert` de react-native-web est un
 * no-op (fonction vide), ce qui rendait muets sur web tous les dialogues de
 * confirmation (déconnexion, suppression de compte…). Sur natif, délégation
 * inchangée à `Alert.alert`. Sur web, `window.confirm` pour les dialogues à
 * bouton d'action (le dernier bouton non-cancel est l'action confirmée) et
 * `window.alert` pour les messages informationnels.
 */

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  const actionable = (buttons ?? []).filter((b) => b.style !== 'cancel');
  const ok = actionable[actionable.length - 1];
  if (!ok) {
    window.alert(text);
    return;
  }
  if (window.confirm(text)) ok.onPress?.();
}

export const prodayAlert = { alert };
