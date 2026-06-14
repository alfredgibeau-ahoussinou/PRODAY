import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';

/** Affiche une alerte avec redirection vers la connexion. */
export function useRequireAuth() {
  const { profile } = useAuth();
  const { openAuth } = useTabNavigation();

  const promptLogin = useCallback(
    (message = 'Connectez-vous pour continuer.') => {
      Alert.alert('Connexion requise', message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => openAuth('login') },
      ]);
    },
    [openAuth],
  );

  const requireAuth = useCallback(
    (message?: string) => {
      if (profile) return true;
      promptLogin(message);
      return false;
    },
    [profile, promptLogin],
  );

  return { profile, requireAuth, promptLogin };
}
