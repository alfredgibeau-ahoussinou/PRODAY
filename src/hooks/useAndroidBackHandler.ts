import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import type { MainTabId } from '../navigation/mainTabConfig';
import type { AuthIntent } from '../context/TabNavigationContext';

interface UseAndroidBackHandlerParams {
  activeTab: MainTabId;
  returnTab: MainTabId | null;
  pendingAuthIntent: AuthIntent | null;
  hasPendingModals: boolean;
  onDismissAuth: () => void;
  onClearPendingModals: () => void;
  onGoBackTab: () => void;
  onGoHome: () => void;
}

/**
 * Gère le bouton Retour matériel sur Android (hardware back press).
 * Permet de fermer les modales, revenir à l'onglet précédent ou revenir à l'accueil
 * au lieu de quitter brutalement l'application.
 */
export function useAndroidBackHandler({
  activeTab,
  returnTab,
  pendingAuthIntent,
  hasPendingModals,
  onDismissAuth,
  onClearPendingModals,
  onGoBackTab,
  onGoHome,
}: UseAndroidBackHandlerParams): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // 1. Fermer l'overlay d'authentification si actif
      if (pendingAuthIntent) {
        onDismissAuth();
        return true;
      }

      // 2. Fermer les vues/modales profondes en attente
      if (hasPendingModals) {
        onClearPendingModals();
        return true;
      }

      // 3. Revenir à l'onglet mémorisé si existant
      if (returnTab && returnTab !== activeTab) {
        onGoBackTab();
        return true;
      }

      // 4. Si sur un onglet secondaire, revenir à l'accueil
      if (activeTab !== 'home') {
        onGoHome();
        return true;
      }

      // 5. Sur l'accueil sans modale : laisser le comportement par défaut (quitter/minimiser)
      return false;
    });

    return () => subscription.remove();
  }, [
    activeTab,
    returnTab,
    pendingAuthIntent,
    hasPendingModals,
    onDismissAuth,
    onClearPendingModals,
    onGoBackTab,
    onGoHome,
  ]);
}
