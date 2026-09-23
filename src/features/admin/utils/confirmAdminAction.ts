import { prodayAlert } from '../../../utils/prodayAlert';

/** Confirmation admin pour actions sensibles. */
export function confirmAdminAction(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  destructive = false,
): void {
  prodayAlert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Confirmer',
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        void Promise.resolve(onConfirm()).catch((e) => {
          prodayAlert.alert('Erreur', e instanceof Error ? e.message : 'Échec');
        });
      },
    },
  ]);
}

