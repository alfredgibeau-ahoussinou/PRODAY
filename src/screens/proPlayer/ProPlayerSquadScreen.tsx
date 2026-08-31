import React from 'react';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { usePlatformFeatureFlags } from '../../hooks/usePlatformFeatureFlags';
import { JoueurUnavailableScreen } from '../../components/joueur/JoueurUnavailableScreen';
import { MercatoScreen } from '../MercatoScreen';
import { ProPlayerGroupScreen } from './ProPlayerGroupScreen';

/**
 * Onglet SQUAD joueur pro.
 * Par défaut = groupe / convocations. Si deep-link mercato → offres.
 */
export const ProPlayerSquadScreen: React.FC = () => {
  const { pendingMercatoView } = useTabNavigation();
  const { isEnabled, disabledCopy, loading } = usePlatformFeatureFlags();

  if (pendingMercatoView) {
    if (!loading && !isEnabled('mercato')) {
      const copy = disabledCopy('mercato');
      return (
        <JoueurUnavailableScreen
          title={copy.title}
          message={copy.message}
          icon="people"
        />
      );
    }
    return <MercatoScreen postScope="pro" />;
  }
  return <ProPlayerGroupScreen />;
};
