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
                'Profil supprimé (partiel)',
                'Le profil Firestore et les documents sont supprimés. Pour effacer aussi le compte de connexion (Auth), déployez les Cloud Functions :\nfirebase deploy --only functions'
              );
            } else if (result && result.authDeleted === true) {
              Alert.alert('Compte supprimé', 'Utilisateur retiré de Firebase Auth et Firestore.');
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
