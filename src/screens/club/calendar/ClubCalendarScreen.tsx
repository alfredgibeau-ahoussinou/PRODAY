import React from 'react';
import { MatchsScreen } from '../../MatchsScreen';
import { HomeScreen } from '../../HomeScreen';
import { useSessionProfile } from '../../../hooks/useSessionProfile';

/**
 * Onglet Matchs club — Match Center immersif (calendrier, invitations, tournois).
 * Le chrome est porté par MatchHomeScreen (atmosphère Club).
 */
export const ClubCalendarScreen: React.FC = () => {
  const profile = useSessionProfile();
  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }
  return <MatchsScreen />;
};
