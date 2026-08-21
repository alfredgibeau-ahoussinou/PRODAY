import { Alert } from 'react-native';

/** Confirmation admin pour actions sensibles. */
export function confirmAdminAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  destructive = false,
): void {
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Confirmer',
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void Promise.resolve(onConfirm()).catch((e) => {
          Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        });
      },
    },
  ]);
}
