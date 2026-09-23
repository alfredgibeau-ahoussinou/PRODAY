import { useCallback, useState } from 'react';
import { prodayAlert } from '../utils/prodayAlert';
import { useAuth } from '../context/AuthContext';
import { prodayHaptics } from '../utils/prodayHaptics';

export function useAccountDeletion() {
  const { deleteAccount, profile } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteAccount = useCallback(() => {
    prodayHaptics.warning();
    prodayAlert.alert(
      'Supprimer mon compte ?',
      'Cette action est irréversible. Votre profil, vos statistiques, vos messages, vos photos et toutes vos données personnelles associées à ProDay seront définitivement supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              prodayAlert.alert(
                'Compte supprimé',
                'Votre compte et toutes vos données personnelles ont été supprimés avec succès.',
              );
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : 'Impossible de supprimer votre compte. Veuillez réessayer.';
              prodayAlert.alert('Erreur', message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [deleteAccount]);

  return { confirmDeleteAccount, deleting, profile };
}
