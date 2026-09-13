import React from 'react';
import type { User } from '../../models/User';
import { PlayerPortalScreen } from '../../screens/player/PlayerPortalScreen';

type Props = {
  profile: User;
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * Point d'entrée Pôle Joueur — monte le portail master Espace Joueur.
 */
export function JoueurAdaptiveHome({ profile }: Props) {
  return <PlayerPortalScreen initialTab="cockpit" />;
}

export default JoueurAdaptiveHome;
