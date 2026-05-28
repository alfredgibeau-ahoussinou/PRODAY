import { Alert } from 'react-native';
import { getErrorMessage } from './errors';

export function adminConfirmDelete(
  title: string,
  message: string,
  onOk: () => Promise<{ authDeleted: boolean } | void>,
  onDone?: () => void
) {
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Supprimer',
      style: 'destructive',
      onPress: () => {
        onOk()
          .then((result) => {
            if (result && result.authDeleted === false) {
              Alert.alert(
                'Profil supprimé',
                'Le document Firestore est supprimé. Le compte Auth peut encore exister tant que les Cloud Functions ne sont pas déployées (firebase deploy --only functions).'
              );
            }
            onDone?.();
          })
          .catch((e) =>
            Alert.alert('Erreur', getErrorMessage(e, 'Suppression impossible'))
          );
      },
    },
  ]);
}

export function adminActionErrorAlert(e: unknown, fallback: string) {
  Alert.alert('Erreur', getErrorMessage(e, fallback));
}
