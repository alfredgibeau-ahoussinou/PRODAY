import React from 'react';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { MercatoScreen } from '../MercatoScreen';
import { ProPlayerGroupScreen } from './ProPlayerGroupScreen';

/**
 * Onglet SQUAD joueur pro.
 * Par défaut = groupe / convocations. Si deep-link mercato → offres.
 */
export const ProPlayerSquadScreen: React.FC = () => {
  const { pendingMercatoView } = useTabNavigation();
  if (pendingMercatoView) {
    return <MercatoScreen postScope="pro" />;
  }
  return <ProPlayerGroupScreen />;
};
